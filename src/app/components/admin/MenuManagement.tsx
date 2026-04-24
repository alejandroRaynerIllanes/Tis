// src/app/components/admin/MenuManagement.tsx
import { useState, useRef, useEffect } from 'react';
import { Tag, ChefHat, Plus, Edit2, Trash2, CloudUpload, X, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { uploadService } from '../../services/upload.service';
import { categoriesService } from '../../services/categories.service';
import { platosService } from '../../services/platos.service';
import { toast } from 'sonner';
interface MenuManagementProps {
  categories: any[];
  setCategories: (cats: any[]) => void;
}

export function MenuManagement({ categories, setCategories }: MenuManagementProps) {
  const { products: dishes, setProducts: setDishes, updateProductStatus } = useAppContext();
  const [menuFilter, setMenuFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '', category: '', description: '', price: '',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kfGVufDF8fHx8MTc3MzM3OTc2OHww&ixlib=rb-4.1.0&q=80&w=1080'
  });

  // Cargar platos reales de MongoDB
 // Cargar platos reales de MongoDB
  const cargarPlatos = async () => {
    try {
      const data = await platosService.getAll();
      console.log("🍔 Datos crudos desde el backend:", data); // <-- ESTO NOS DIRÁ LA VERDAD

      const platosFormateados = data.map((p: any) => ({
        id: p._id,
        name: p.nombre,
        // FIX: El backend popula la categoría, así que extraemos el _id del objeto.
        category: typeof p.categoria === 'object' && p.categoria !== null ? p.categoria._id : p.categoria,
        price: p.precio,
        image: p.imagenUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kfGVufDF8fHx8MTc3MzM3OTc2OHww&ixlib=rb-4.1.0&q=80&w=1080',
        description: p.descripcion,
        status: (p.disponible ? 'Disponible' : 'Agotado') as 'Disponible' | 'Agotado'
      }));
      
      console.log("✨ Platos formateados para React:", platosFormateados);
      setDishes(platosFormateados);
    } catch (error) {
      console.error("❌ Error CRÍTICO al cargar los platos:", error);
    }
  };

  useEffect(() => {
    cargarPlatos();
  }, []);

  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const presetCategoryRef = useRef<string>('');
  const [isPresetCategory, setIsPresetCategory] = useState(false);
  
  // Estado de carga para la imagen
  const [isUploading, setIsUploading] = useState(false);

  // Función para subir a Cloudinary
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo pesa más de 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      const response = await uploadService.uploadImage(file);
      setFormData(prev => ({ ...prev, image: response.url }));
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      toast.error("Hubo un problema al subir la foto.");
    } finally {
      setIsUploading(false);
    }
  };

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ label: '' });

  const toggleStatus = (id: string) => {
    const dish = dishes.find(d => d.id === id);
    if (dish) updateProductStatus(id, dish.status === 'Disponible' ? 'Agotado' : 'Disponible');
  };

  const handleOpenAddModal = (preselectedCategory?: string) => {
    const preset = preselectedCategory ?? '';
    presetCategoryRef.current = preset;
    setIsPresetCategory(!!preset);
    setEditingId(null);
    setFormData({
      title: '', category: preset, description: '', price: '',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kfGVufDF8fHx8MTc3MzM3OTc2OHww&ixlib=rb-4.1.0&q=80&w=1080'
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isModalOpen && editingId === null && presetCategoryRef.current) {
      setFormData(prev => ({ ...prev, category: presetCategoryRef.current }));
    }
  }, [isModalOpen]);

  const handleOpenEditModal = (dish: any) => {
    setEditingId(dish.id);
    setIsPresetCategory(false);
    presetCategoryRef.current = '';
    setFormData({ title: dish.name, category: dish.category, description: dish.description || '', price: String(dish.price), image: dish.image });
    setIsModalOpen(true);
  };

 const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("1. Botón guardar presionado. Datos actuales:", formData);

    // 1. Validamos con alertas para que NO sea silencioso
    if (!formData.title || !formData.price || !formData.category) {
      toast.warning("Por favor llena el nombre, el precio y selecciona una categoría.");
      return;
    }

    // Tu backend EXIGE una descripción según el modelo de Mongoose
    if (!formData.description || formData.description.trim() === "") {
      toast.warning("La descripción es obligatoria para poder guardar en la base de datos.");
      return;
    }

    try {
      console.log("2. Todo correcto. Armando paquete para el backend...");
      const datosParaBackend = {
        nombre: formData.title,
        descripcion: formData.description,
        precio: Number(formData.price),
        imagenUrl: formData.image,
        categoria: formData.category, // Debe ser el _id de Mongo de la categoría
        disponible: true
      };
      console.log("3. Paquete listo para enviar:", datosParaBackend);

      if (editingId) {
        console.log("4. Editando plato existente...");
        const platoActualizado = await platosService.update(editingId, datosParaBackend);
        
        // ✨ OPTIMIZACIÓN: Actualizamos solo el plato editado en el estado local
        setDishes(dishes.map(d => d.id === editingId ? {
          id: platoActualizado._id,
          name: platoActualizado.nombre,
          category: typeof platoActualizado.categoria === 'object' ? platoActualizado.categoria._id : platoActualizado.categoria,
          price: platoActualizado.precio,
          image: platoActualizado.imagenUrl,
          description: platoActualizado.descripcion,
          status: (platoActualizado.disponible ? 'Disponible' : 'Agotado') as 'Disponible' | 'Agotado'
        } : d));

      } else {
        console.log("4. Creando nuevo plato...");
        const platoCreado = await platosService.create(datosParaBackend);
        console.log("5. Respuesta del servidor:", platoCreado);

        // ✨ OPTIMIZACIÓN: Añadimos el nuevo plato al estado local sin recargar todo
        setDishes([...dishes, {
          id: platoCreado._id,
          name: platoCreado.nombre,
          category: typeof platoCreado.categoria === 'object' ? platoCreado.categoria._id : platoCreado.categoria,
          price: platoCreado.precio,
          image: platoCreado.imagenUrl,
          description: platoCreado.descripcion,
          status: (platoCreado.disponible ? 'Disponible' : 'Agotado') as 'Disponible' | 'Agotado'
        }]);
      }

      // Ya no necesitamos recargar toda la lista desde la BD
      // await cargarPlatos();
      setIsModalOpen(false);
      
      toast.success("¡Plato guardado con éxito en la Base de Datos!");

    } catch (error) {
      console.error("❌ Error CRÍTICO al guardar el plato:", error);
      toast.error("Hubo un error al guardar el plato.", { description: "Revisa la consola para ver el detalle." });
    }
  };

  // 🚀 BUG FIX: Conectar la eliminación a la base de datos
  const handleDeleteDish = async (id: string) => {
    try {
      await platosService.remove(id);
      // Actualizamos el estado local para que el cambio sea instantáneo
      setDishes(dishes.filter(d => d.id !== id));
      setItemToDelete(null);
      toast.success("Plato eliminado de la base de datos.");
    } catch (error) {
      console.error("Error al eliminar el plato:", error);
      toast.error("No se pudo eliminar el plato.");
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!categoryFormData.label) return;
  try {
    const created = await categoriesService.create(categoryFormData.label);
    setCategories([...categories, { id: created._id, label: created.nombre }]);
    setMenuFilter('all');
    setIsCategoryModalOpen(false);
    setCategoryFormData({ label: '' });
  } catch (error) {
    console.error(error);
    toast.error("Error al crear categoría rápida.");
  }
};

  return (
    <>
      <header className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 sticky top-0 bg-[#FCE4D6]/90 backdrop-blur-md z-10">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#4B2E2D] mb-1 lg:mb-2">Gestión de Menú</h1>
          <p className="text-[#4B2E2D]/70 font-medium text-sm lg:text-base">Administra las opciones de tu menú y su disponibilidad</p>
        </div>
        <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center gap-2 bg-[#D0543A] text-white px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl font-bold shadow-lg shadow-[#D0543A]/30 hover:bg-[#b5462f] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98] text-sm sm:text-base whitespace-nowrap">
          <Plus size={18} strokeWidth={3} /> Añadir Categoría
        </button>
      </header>

      <div className="p-4 sm:p-6 lg:p-10 pt-2 flex flex-col gap-8 lg:gap-10">
        <div className="overflow-x-auto pb-1 -mb-1">
          <div className="flex items-center gap-2 min-w-max">
            <button onClick={() => setMenuFilter('all')} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 whitespace-nowrap border-2 ${menuFilter === 'all' ? 'bg-[#D0543A] border-[#D0543A] text-white shadow-md shadow-[#D0543A]/25' : 'bg-white border-[#E57C5D]/20 text-[#4B2E2D]/60 hover:border-[#D0543A]/40 hover:text-[#4B2E2D] hover:bg-[#FCE4D6]/60'}`}>
              Todos <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-black transition-colors ${menuFilter === 'all' ? 'bg-white/25 text-white' : 'bg-[#FCE4D6] text-[#D0543A]'}`}>{dishes.length}</span>
            </button>
            {categories.map(cat => {
              const count = dishes.filter(d => d.category === cat.id).length;
              return (
                <button key={cat.id} onClick={() => setMenuFilter(cat.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 whitespace-nowrap border-2 ${menuFilter === cat.id ? 'bg-[#D0543A] border-[#D0543A] text-white shadow-md shadow-[#D0543A]/25' : 'bg-white border-[#E57C5D]/20 text-[#4B2E2D]/60 hover:border-[#D0543A]/40 hover:text-[#4B2E2D] hover:bg-[#FCE4D6]/60'}`}>
                  {cat.label} <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-black transition-colors ${menuFilter === cat.id ? 'bg-white/25 text-white' : 'bg-[#FCE4D6] text-[#D0543A]'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {categories.filter(cat => menuFilter === 'all' || cat.id === menuFilter).map(category => {
          const categoryDishes = dishes.filter(dish => dish.category === category.id);
          return (
            <div key={category.id} ref={el => { categoryRefs.current[category.id] = el; }} className="flex flex-col gap-5">
              <div className="flex items-center gap-2 sm:gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-[#4B2E2D] shrink-0">{category.label}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E57C5D]/15 text-[#D0543A] border border-[#E57C5D]/25 shrink-0">{categoryDishes.length} platos</span>
                <div className="h-0.5 flex-1 bg-[#E57C5D]/25 rounded-full"></div>
              </div>
              {categoryDishes.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {categoryDishes.map((dish) => (
                      <div key={dish.id} className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col group border border-transparent hover:border-[#E57C5D]/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                        <div className="relative h-56 overflow-hidden">
                          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full font-bold text-[#4B2E2D] shadow-sm">{dish.price} Bs.</div>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          <h3 className="text-xl font-black text-[#4B2E2D] leading-tight mb-1 line-clamp-1">{dish.name}</h3>
                          <span className="text-[11px] font-bold text-[#E57C5D] uppercase tracking-wider mb-3">{category.label}</span>
                          <p className="text-[#4B2E2D]/70 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed">{dish.description || 'Sin descripción disponible.'}</p>
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-3">
                              <button onClick={() => toggleStatus(dish.id)} className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${dish.status === 'Disponible' ? 'bg-[#E57C5D]' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${dish.status === 'Disponible' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                              </button>
                              <span className={`text-sm font-bold ${dish.status === 'Disponible' ? 'text-[#E57C5D]' : 'text-gray-400'}`}>{dish.status === 'Disponible' ? 'Activo' : 'Agotado'}</span>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleOpenEditModal(dish)} className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-[#FCE4D6] rounded-lg transition-all"><Edit2 size={18} /></button>
                              <button onClick={() => setItemToDelete(dish.id)} className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-[#D0543A]/10 rounded-lg transition-all"><Trash2 size={18} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => handleOpenAddModal(category.id)} className="flex items-center gap-1.5 text-sm font-bold text-[#D0543A] hover:bg-[#D0543A]/8 px-4 py-2 rounded-lg transition-all w-fit"><Plus size={14} strokeWidth={2.5} /> Añadir al menú</button>
                </>
              ) : (
                <div className="py-8 sm:py-10 flex flex-col items-center text-center bg-white/60 rounded-2xl border-2 border-dashed border-[#E57C5D]/20">
                  <ChefHat size={28} className="text-[#E57C5D]/40 mb-2" />
                  <p className="text-[#4B2E2D]/45 font-medium text-sm mb-3">Esta categoría aún no tiene platos</p>
                  <button onClick={() => handleOpenAddModal(category.id)} className="flex items-center gap-1.5 text-sm font-bold text-[#D0543A] hover:bg-[#D0543A]/8 px-4 py-2 rounded-lg transition-all"><Plus size={14} strokeWidth={2.5} /> Añadir al menú</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Nuevo/Editar Plato */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-[600px] border-[6px] border-[#4B2E2D] rounded-3xl p-8 relative my-8 shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A] transition-colors"><X size={24} /></button>
            <h2 className="text-3xl font-bold text-[#4B2E2D] mb-6">{editingId ? 'Editar Elemento' : 'Nuevo Elemento'}</h2>
            
            <form className="space-y-5" onSubmit={handleSaveDish}>
              {/* COMPONENTE DE UPLOAD INTEGRADO AQUÍ */}
              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Subir Fotografía</label>
                <label className="border-2 border-dashed border-[#E57C5D] bg-[#FCE4D6]/10 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-[#FCE4D6]/30 transition-colors group relative overflow-hidden h-48 w-full">
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    className="hidden" 
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-8 h-8 border-4 border-[#E57C5D] border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span className="text-[#4B2E2D] font-bold">Subiendo a la nube...</span>
                    </div>
                  ) : formData.image && formData.image !== 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kfGVufDF8fHx8MTc3MzM3OTc2OHww&ixlib=rb-4.1.0&q=80&w=1080' ? (
                    <div className="absolute inset-0">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white font-bold px-4 py-2 bg-[#D0543A] rounded-lg shadow-lg">Cambiar Foto</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <CloudUpload size={48} className="text-[#E57C5D] mb-3 group-hover:scale-110 transition-transform" />
                      <span className="text-[#4B2E2D] font-medium text-center">Haz clic para subir o arrastra la imagen aquí</span>
                      <span className="text-[#4B2E2D]/60 text-sm mt-1">PNG, JPG hasta 5MB</span>
                    </div>
                  )}
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Nombre del Elemento</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40" placeholder="Ej: Hamburguesa Clásica" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Precio (Bs.)</label>
                <input type="number" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40" placeholder="0.00" min="0" step="0.5" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Descripción</label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40 resize-none" placeholder="Ingredientes principales..." />
              </div>

              <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-[#FCE4D6]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-[#4B2E2D]/60 hover:bg-[#FCE4D6]/50 hover:text-[#4B2E2D] rounded-xl transition-all">Cancelar</button>
                <button type="submit" disabled={isUploading} className={`px-8 py-3 text-white font-bold rounded-xl shadow-lg transition-all ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#D0543A] hover:bg-[#b5462f] hover:shadow-xl active:scale-[0.98]'}`}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Elemento */}
      {itemToDelete !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FCE4D6] w-full max-w-[400px] border-[4px] border-[#D0543A] rounded-3xl p-8 relative shadow-2xl flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold text-[#4B2E2D] mb-3">¿Eliminar del Menú?</h2>
            <div className="flex gap-4 w-full mt-4">
              <button onClick={() => setItemToDelete(null)} className="flex-1 py-3 px-4 font-bold text-[#4B2E2D] bg-transparent border-2 border-[#4B2E2D] rounded-xl transition-all">Cancelar</button>
              <button onClick={() => itemToDelete && handleDeleteDish(itemToDelete)} className="flex-1 py-3 px-4 bg-[#D0543A] text-white font-bold rounded-xl transition-all border-2 border-[#D0543A]">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Añadir Categoría rápida */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-[400px] border-[6px] border-[#4B2E2D] rounded-3xl p-8 relative shadow-2xl">
            <button onClick={() => setIsCategoryModalOpen(false)} className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A]"><X size={24} /></button>
            <h2 className="text-3xl font-bold text-[#4B2E2D] mb-6">Nueva Categoría</h2>
            <form onSubmit={handleSaveCategory}>
              <input type="text" required value={categoryFormData.label} onChange={(e) => setCategoryFormData({ label: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] mb-6" placeholder="Ej: Platos Especiales" />
              <div className="flex justify-end gap-4"><button type="submit" className="px-8 py-3 bg-[#D0543A] text-white font-bold rounded-xl">Guardar</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}