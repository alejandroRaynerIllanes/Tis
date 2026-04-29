// src/app/components/admin/CategoryManagement.tsx
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { categoriesService } from '../../services/categories.service';
import { toast } from 'sonner';

export interface UICategory {
  id: string;
  label: string;
}

interface CategoryManagementProps {
  categories: UICategory[];
  setCategories: (cats: UICategory[]) => void;
}

export function CategoryManagement({ categories, setCategories }: CategoryManagementProps) {
  const { products: dishes, setProducts: setDishes } = useAppContext();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryEditingId, setCategoryEditingId] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ label: '' });
  const[categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 🚀 PASO 1: Listado dinámico (Consumir las categorías desde el backend al abrir)
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const data = await categoriesService.getAll();
        setCategories(data.map((cat: any) => ({ id: cat._id, label: cat.nombre })));
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        toast.error("Error al cargar las categorías desde el servidor.");
      }
    };
    cargarCategorias();
  },[]);

  const handleOpenAddCategoryModal = () => {
    setCategoryEditingId(null);
    setCategoryFormData({ label: '' });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategoryModal = (category: UICategory) => {
    setCategoryEditingId(category.id);
    setCategoryFormData({ label: category.label });
    setIsCategoryModalOpen(true);
  };

  // 🚀 CONECTADO AL BACKEND (Crear y Editar)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Limpiar espacios al inicio y final
    const nombreLimpio = categoryFormData.label.trim();
    if (!nombreLimpio) {
      toast.warning("El nombre de la categoría no puede estar vacío.");
      return;
    }

    // 2. Longitud mínima y caracteres repetidos (ej: "aaa")
    if (nombreLimpio.length < 3 || /^(.)\1+$/.test(nombreLimpio)) {
      toast.warning("Ingresa un nombre de categoría válido (mínimo 3 caracteres).");
      return;
    }

    // 3. Evitar duplicados (Ignorando mayúsculas/minúsculas y la categoría actual si estamos editando)
    const isDuplicate = categories.some(
      cat => cat.label.toLowerCase() === nombreLimpio.toLowerCase() && cat.id !== categoryEditingId
    );
    if (isDuplicate) {
      toast.warning("Ya existe una categoría con este nombre.");
      return;
    }

    setIsLoading(true);
    try {
      if (categoryEditingId) {
        // PUT: Actualizar en BD
        const updated = await categoriesService.update(categoryEditingId, nombreLimpio);
        
        // Actualizamos los platos locales si el nombre de la categoría cambió
        const oldCat = categories.find((c) => c.id === categoryEditingId);
        if (oldCat && oldCat.label !== updated.nombre) {
          setDishes(
            dishes.map((d) =>
              d.category === categoryEditingId ? { ...d, category: updated.nombre } : d
            )
          );
        }

        // Actualizamos la lista local mapeando el formato
        setCategories(
          categories.map((cat) =>
            cat.id === categoryEditingId ? { ...cat, label: updated.nombre } : cat
          )
        );
        toast.success("Categoría actualizada con éxito.");
      } else {
        // POST: Crear en BD
        const created = await categoriesService.create(nombreLimpio);
        // Guardamos usando el _id real de MongoDB
        setCategories([...categories, { id: created._id, label: created.nombre }]);
        toast.success("Categoría creada con éxito.");
      }
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error("Error al guardar categoría:", error);
      toast.error("Hubo un error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 CONECTADO AL BACKEND (Eliminar)
  const handleDeleteCategory = async (categoryId: string) => {
    setIsDeleting(true);
    try {
      await categoriesService.remove(categoryId);
      setCategories(categories.filter(cat => cat.id !== categoryId));
      setCategoryToDelete(null);
      toast.success("Categoría eliminada con éxito.");
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      toast.error("No se pudo eliminar la categoría.", { description: "Verifica que no tenga platos asignados." });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <header className="px-10 py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sticky top-0 bg-[#FCE4D6]/90 backdrop-blur-md z-10">
        <div>
          <h1 className="text-4xl font-bold text-[#4B2E2D] mb-2">Categorías del Menú</h1>
          <p className="text-[#4B2E2D]/70 font-medium">
            Gestiona las diferentes secciones de tu carta (BD Conectada)
          </p>
        </div>
        <button
          onClick={handleOpenAddCategoryModal}
          className="flex items-center gap-2 bg-[#D0543A] text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-[#D0543A]/30 hover:bg-[#b5462f] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98]"
        >
          <Plus size={20} strokeWidth={3} /> Añadir Categoría
        </button>
      </header>

      <div className="p-10 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white p-6 rounded-2xl shadow-xl flex items-center justify-between group border border-transparent hover:border-[#E57C5D]/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            >
              <h3 className="text-xl font-bold text-[#4B2E2D]">{cat.label}</h3>
              <div className="flex gap-2 opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenEditCategoryModal(cat)}
                  className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-[#FCE4D6] rounded-lg transition-all"
                  aria-label="Editar"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => setCategoryToDelete(cat.id)}
                  className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-[#D0543A]/10 rounded-lg transition-all"
                  aria-label="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Categoria */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-[400px] border-[6px] border-[#4B2E2D] rounded-3xl p-8 relative my-8 shadow-2xl">
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A]"
            >
              <X size={24} />
            </button>
            <h2 className="text-3xl font-bold text-[#4B2E2D] mb-6">
              {categoryEditingId ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            <form onSubmit={handleSaveCategory}>
              <input
                type="text"
                required
                value={categoryFormData.label}
                onChange={(e) =>
                  setCategoryFormData({
                    label: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '')
                  })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none mb-6"
                placeholder="Ej: Platos Especiales"
              />
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-6 py-3 font-bold text-[#4B2E2D]/60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-8 py-3 text-white font-bold rounded-xl shadow-lg transition-all ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#D0543A] hover:bg-[#b5462f]'}`}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {categoryToDelete !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FCE4D6] w-full max-w-[400px] border-[4px] border-[#D0543A] rounded-3xl p-8 relative shadow-2xl flex flex-col items-center text-center">
            <AlertTriangle size={32} className="text-[#D0543A] mb-4" />
            <h2 className="text-2xl font-bold text-[#4B2E2D] mb-3">¿Eliminar Categoría?</h2>
            <div className="flex gap-4 w-full mt-4">
              <button 
                onClick={() => setCategoryToDelete(null)} 
                disabled={isDeleting} 
                className="flex-1 py-3 px-4 font-bold text-[#4B2E2D] border-2 border-[#4B2E2D] rounded-xl disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDeleteCategory(categoryToDelete)} 
                disabled={isDeleting}
                className={`flex-1 py-3 px-4 text-white font-bold rounded-xl transition-all ${isDeleting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#D0543A] hover:bg-[#b5462f]'}`}
              >
                {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}