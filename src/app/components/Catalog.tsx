import { LayoutDashboard, Tag, UtensilsCrossed, ChefHat, ArrowLeft, Plus, Edit2, Trash2, Search, CloudUpload, X, AlertTriangle, Users, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useState } from 'react';

const INITIAL_CATEGORIES = [
  { id: 'plato-principal', label: 'Plato principal' },
  { id: 'acompanamientos', label: 'Acompañamientos' },
  { id: 'postres', label: 'Postres' },
  { id: 'bebidas', label: 'Bebidas' }
];

const INITIAL_LOCATIONS = [
  { id: 'interior', name: 'Interior' },
  { id: 'terraza', name: 'Terraza' },
  { id: 'patio', name: 'Patio' }
];

const INITIAL_TABLES = [
  { id: '1', number: 'Mesa 1', capacity: 4, locationId: 'interior' },
  { id: '2', number: 'Mesa 2', capacity: 2, locationId: 'interior' },
  { id: '3', number: 'Mesa 3', capacity: 6, locationId: 'interior' },
  { id: '4', number: 'Mesa 4', capacity: 4, locationId: 'interior' },
  { id: '5', number: 'Terraza 1', capacity: 2, locationId: 'terraza' }
];

const DISHES = [
  {
    id: 1,
    title: 'Hamburguesa Sabor Real',
    category: 'plato-principal',
    description: 'Doble carne de res, queso cheddar fundido, tocino crujiente, lechuga fresca y nuestra salsa especial de la casa.',
    price: '45 Bs.',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwYnVyZ2VyfGVufDF8fHx8MTc3MzMyMTIyMHww&ixlib=rb-4.1.0&q=80&w=1080',
    isActive: true
  },
  {
    id: 2,
    title: 'Ensalada Fresca del Campo',
    category: 'acompanamientos',
    description: 'Mix de hojas verdes orgánicas, tomates cherry asados, nueces pecanas, queso de cabra y vinagreta de miel y mostaza.',
    price: '35 Bs.',
    image: 'https://images.unsplash.com/photo-1677653805080-59c57727c84e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHNhbGFkfGVufDF8fHx8MTc3MzM3OTc2NHww&ixlib=rb-4.1.0&q=80&w=1080',
    isActive: true
  },
  {
    id: 3,
    title: 'Pasta al Pesto Rústico',
    category: 'plato-principal',
    description: 'Pasta fresca artesanal al dente bañada en nuestra clásica salsa pesto genovés con albahaca, piñones y parmesano.',
    price: '40 Bs.',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGRpc2h8ZW58MXx8fHwxNzczMzc5NzY3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    isActive: false
  },
  {
    id: 4,
    title: 'Tiramisú Clásico',
    category: 'postres',
    description: 'Bizcocho bañado en café expreso, suave crema de mascarpone y un toque de cacao puro en polvo.',
    price: '25 Bs.',
    image: 'https://images.unsplash.com/photo-1714385905983-6f8e06fffae1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aXJhbWlzdSUyMGRlc3NlcnR8ZW58MXx8fHwxNzczMzAxNzI1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    isActive: true
  },
  {
    id: 5,
    title: 'Limonada de Menta y Jengibre',
    category: 'bebidas',
    description: 'Refrescante limonada natural con hojas de menta fresca, un toque de jengibre y hielo frappé.',
    price: '15 Bs.',
    image: 'https://images.unsplash.com/photo-1627366422858-c5af17ac71ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW50JTIwbGVtb25hZGV8ZW58MXx8fHwxNzczMzgxMjIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    isActive: true
  }
];

export function Catalog() {
  const navigate = useNavigate();
  const [dishes, setDishes] = useState(DISHES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kfGVufDF8fHx8MTc3MzM3OTc2OHww&ixlib=rb-4.1.0&q=80&w=1080'
  });

  const [activeView, setActiveView] = useState<'menu' | 'categories' | 'tables'>('tables');
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryEditingId, setCategoryEditingId] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ label: '' });
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const [locations, setLocations] = useState(INITIAL_LOCATIONS);
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableEditingId, setTableEditingId] = useState<string | null>(null);
  const [tableFormData, setTableFormData] = useState({ number: '', capacity: 2, locationId: 'interior' });
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationEditingId, setLocationEditingId] = useState<string | null>(null);
  const [locationFormData, setLocationFormData] = useState({ name: '' });
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('all');

  const handleOpenAddTableModal = () => {
    setTableEditingId(null);
    setTableFormData({ number: '', capacity: 2, locationId: locations.length > 0 ? locations[0].id : 'interior' });
    setIsTableModalOpen(true);
  };

  const handleOpenEditTableModal = (table: typeof INITIAL_TABLES[0]) => {
    setTableEditingId(table.id);
    setTableFormData({ number: table.number, capacity: table.capacity, locationId: table.locationId });
    setIsTableModalOpen(true);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableFormData.number || !tableFormData.capacity) return;

    if (tableEditingId) {
      setTables(tables.map(t => 
        t.id === tableEditingId ? { ...t, number: tableFormData.number, capacity: Number(tableFormData.capacity), locationId: tableFormData.locationId } : t
      ));
    } else {
      const newId = Date.now().toString();
      setTables([...tables, { id: newId, number: tableFormData.number, capacity: Number(tableFormData.capacity), locationId: tableFormData.locationId }]);
    }
    setIsTableModalOpen(false);
  };

  const handleOpenLocationManagerModal = () => {
    setShowLocationForm(false);
    setLocationEditingId(null);
    setLocationFormData({ name: '' });
    setIsLocationModalOpen(true);
  };

  const handleOpenAddLocationForm = () => {
    setLocationEditingId(null);
    setLocationFormData({ name: '' });
    setShowLocationForm(true);
  };

  const handleOpenEditLocationModal = (location: typeof INITIAL_LOCATIONS[0]) => {
    setLocationEditingId(location.id);
    setLocationFormData({ name: location.name });
    setShowLocationForm(true);
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationFormData.name) return;

    if (locationEditingId) {
      setLocations(locations.map(loc => 
        loc.id === locationEditingId ? { ...loc, name: locationFormData.name } : loc
      ));
    } else {
      const newId = locationFormData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setLocations([...locations, { id: newId, name: locationFormData.name }]);
    }
    setShowLocationForm(false);
    setLocationFormData({ name: '' });
  };

  const handleDeleteLocation = (locationId: string) => {
    // Eliminar la ubicación y todas las mesas que pertenecen a ella
    setLocations(locations.filter(loc => loc.id !== locationId));
    setTables(tables.filter(t => t.locationId !== locationId));
    setLocationToDelete(null);
  };

  const toggleStatus = (id: number) => {
    setDishes(dishes.map(dish => 
      dish.id === id ? { ...dish, isActive: !dish.isActive } : dish
    ));
  };

  const handleOpenAddCategoryModal = () => {
    setCategoryEditingId(null);
    setCategoryFormData({ label: '' });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategoryModal = (category: typeof INITIAL_CATEGORIES[0]) => {
    setCategoryEditingId(category.id);
    setCategoryFormData({ label: category.label });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.label) return;

    if (categoryEditingId) {
      setCategories(categories.map(cat => 
        cat.id === categoryEditingId ? { ...cat, label: categoryFormData.label } : cat
      ));
    } else {
      const newId = categoryFormData.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setCategories([...categories, { id: newId, label: categoryFormData.label }]);
    }
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
    setCategoryToDelete(null);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      category: '',
      description: '',
      price: '',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kfGVufDF8fHx8MTc3MzM3OTc2OHww&ixlib=rb-4.1.0&q=80&w=1080'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dish: typeof DISHES[0]) => {
    setEditingId(dish.id);
    setFormData({
      title: dish.title,
      category: dish.category,
      description: dish.description,
      price: dish.price.replace(' Bs.', ''), // remove suffix for input
      image: dish.image
    });
    setIsModalOpen(true);
  };

  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price || !formData.category) return;

    if (editingId) {
      setDishes(dishes.map(d => 
        d.id === editingId 
          ? { ...d, title: formData.title, category: formData.category, description: formData.description, price: `${formData.price} Bs.` } 
          : d
      ));
    } else {
      const newDish = {
        id: Date.now(),
        title: formData.title,
        category: formData.category,
        description: formData.description,
        price: `${formData.price} Bs.`,
        image: formData.image,
        isActive: true
      };
      setDishes([...dishes, newDish]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#FCE4D6] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-[#4B2E2D] text-white flex flex-col h-full shadow-2xl z-10">
        <div className="p-8 pb-4">
          <h2 className="text-2xl font-bold tracking-wide">Sabor & Gestión</h2>
          <div className="h-1 w-12 bg-[#E57C5D] mt-4 rounded-full"></div>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all">
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </a>
          <button 
            onClick={() => setActiveView('categories')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeView === 'categories' ? 'bg-[#E57C5D] text-white shadow-lg shadow-[#E57C5D]/20' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
          >
            <Tag size={20} />
            <span className="font-medium">Categorías</span>
          </button>
          <button 
            onClick={() => setActiveView('tables')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeView === 'tables' ? 'bg-[#E57C5D] text-white shadow-lg shadow-[#E57C5D]/20' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
          >
            <UtensilsCrossed size={20} />
            <span className="font-medium">Mesas</span>
          </button>
          <button 
            onClick={() => setActiveView('menu')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeView === 'menu' ? 'bg-[#E57C5D] text-white shadow-lg shadow-[#E57C5D]/20' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
          >
            <ChefHat size={20} />
            <span className="font-medium">Menú</span>
          </button>
        </nav>

        <div className="p-4">
          <button 
            onClick={() => navigate('/modules')}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Volver al Inicio</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative">
        {activeView === 'menu' ? (
          <>
            {/* Header */}
            <header className="px-10 py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sticky top-0 bg-[#FCE4D6]/90 backdrop-blur-md z-10">
          <div>
            <h1 className="text-4xl font-bold text-[#4B2E2D] mb-2">Gestión de Menú</h1>
            <p className="text-[#4B2E2D]/70 font-medium">Administra las opciones de tu menú y su disponibilidad</p>
          </div>
          
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-[#D0543A] text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-[#D0543A]/30 hover:bg-[#b5462f] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98]">
            <Plus size={20} strokeWidth={3} />
            Añadir al Menú
          </button>
        </header>

        {/* Content Area */}
        <div className="p-10 pt-4 flex flex-col gap-10">
          {categories.map(category => {
            const categoryDishes = dishes.filter(dish => dish.category === category.id);
            if (categoryDishes.length === 0) return null;
            
            return (
              <div key={category.id} className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-[#4B2E2D]">{category.label}</h2>
                  <div className="h-0.5 flex-1 bg-[#E57C5D]/30 rounded-full"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {categoryDishes.map((dish) => (
                    <div key={dish.id} className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col group border border-transparent hover:border-[#E57C5D]/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                      {/* Image Area */}
                      <div className="relative h-56 overflow-hidden">
                        <img 
                          src={dish.image} 
                          alt={dish.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full font-bold text-[#4B2E2D] shadow-sm">
                          {dish.price}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-xl font-bold text-[#4B2E2D] mb-3 line-clamp-1">{dish.title}</h3>
                        <p className="text-[#4B2E2D]/70 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed">
                          {dish.description}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          {/* Custom Toggle Switch */}
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => toggleStatus(dish.id)}
                              className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
                                dish.isActive ? 'bg-[#E57C5D]' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                                dish.isActive ? 'translate-x-6' : 'translate-x-0'
                              }`}></div>
                            </button>
                            <span className={`text-sm font-bold ${dish.isActive ? 'text-[#E57C5D]' : 'text-gray-400'}`}>
                              {dish.isActive ? 'Activo' : 'Agotado'}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleOpenEditModal(dish)}
                              className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-[#FCE4D6] rounded-lg transition-all" aria-label="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => setItemToDelete(dish.id)}
                              className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-[#D0543A]/10 rounded-lg transition-all" aria-label="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
          </>
        ) : activeView === 'categories' ? (
          <>
            <header className="px-10 py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sticky top-0 bg-[#FCE4D6]/90 backdrop-blur-md z-10">
              <div>
                <h1 className="text-4xl font-bold text-[#4B2E2D] mb-2">Categorías del Menú</h1>
                <p className="text-[#4B2E2D]/70 font-medium">Gestiona las diferentes secciones de tu carta</p>
              </div>
              
              <button 
                onClick={handleOpenAddCategoryModal}
                className="flex items-center gap-2 bg-[#D0543A] text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-[#D0543A]/30 hover:bg-[#b5462f] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98]">
                <Plus size={20} strokeWidth={3} />
                Añadir Categoría
              </button>
            </header>

            <div className="p-10 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-white p-6 rounded-2xl shadow-xl flex items-center justify-between group border border-transparent hover:border-[#E57C5D]/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                    <h3 className="text-xl font-bold text-[#4B2E2D]">{cat.label}</h3>
                    <div className="flex gap-2 opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEditCategoryModal(cat)}
                        className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-[#FCE4D6] rounded-lg transition-all" aria-label="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => setCategoryToDelete(cat.id)}
                        className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-[#D0543A]/10 rounded-lg transition-all" aria-label="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <header className="px-10 py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sticky top-0 bg-[#FCE4D6]/90 backdrop-blur-md z-10">
              <div>
                <h1 className="text-4xl font-bold text-[#4B2E2D] mb-2">Gestión de Mesas</h1>
                <p className="text-[#4B2E2D]/70 font-medium">Administra los espacios físicos de tu local y su capacidad</p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleOpenLocationManagerModal}
                  className="flex items-center gap-2 bg-[#E57C5D] text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-[#E57C5D]/30 hover:bg-[#D0543A] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98]">
                  <Plus size={20} strokeWidth={3} />
                  Ubicaciones
                </button>
                <button 
                  onClick={handleOpenAddTableModal}
                  className="flex items-center gap-2 bg-[#D0543A] text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-[#D0543A]/30 hover:bg-[#b5462f] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98]">
                  <Plus size={20} strokeWidth={3} />
                  Añadir Mesa
                </button>
              </div>
            </header>

            <div className="p-10 pt-4">
              {/* Carrusel de Ubicaciones */}
              <div className="mb-8 overflow-x-auto pb-2">
                <div className="flex gap-3 min-w-max">
                  <button
                    onClick={() => setSelectedLocationFilter('all')}
                    className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
                      selectedLocationFilter === 'all'
                        ? 'bg-[#D0543A] text-white shadow-lg shadow-[#D0543A]/30'
                        : 'bg-white text-[#4B2E2D] border-2 border-[#E57C5D]/30 hover:border-[#E57C5D] hover:shadow-md'
                    }`}
                  >
                    Todas ({tables.length})
                  </button>
                  {locations.map(location => {
                    const locationTablesCount = tables.filter(t => t.locationId === location.id).length;
                    return (
                      <button
                        key={location.id}
                        onClick={() => setSelectedLocationFilter(location.id)}
                        className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
                          selectedLocationFilter === location.id
                            ? 'bg-[#D0543A] text-white shadow-lg shadow-[#D0543A]/30'
                            : 'bg-white text-[#4B2E2D] border-2 border-[#E57C5D]/30 hover:border-[#E57C5D] hover:shadow-md'
                        }`}
                      >
                        {location.name} ({locationTablesCount})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {tables
                  .filter(table => selectedLocationFilter === 'all' || table.locationId === selectedLocationFilter)
                  .map(table => {
                  const location = locations.find(loc => loc.id === table.locationId);
                  return (
                    <div key={table.id} className="bg-white p-6 rounded-2xl shadow-xl flex flex-col border border-transparent hover:border-[#E57C5D]/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#FCE4D6] flex items-center justify-center text-[#E57C5D]">
                          <UtensilsCrossed size={24} />
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleOpenEditTableModal(table)}
                            className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-[#FCE4D6] rounded-lg transition-all" aria-label="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => setTableToDelete(table.id)}
                            className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-[#D0543A]/10 rounded-lg transition-all" aria-label="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-[#4B2E2D] mb-1">{table.number}</h3>
                      
                      <div className="flex items-center gap-2 text-[#4B2E2D]/70 font-medium mb-2">
                        <Users size={16} />
                        <span>{table.capacity} personas</span>
                      </div>
                      
                      {location && (
                        <div className="flex items-center gap-2 text-[#E57C5D] font-medium text-sm">
                          <MapPin size={14} />
                          <span>{location.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modal Nuevo/Editar Plato */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-[600px] border-[6px] border-[#4B2E2D] rounded-3xl p-8 relative my-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A] transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-bold text-[#4B2E2D] mb-6">{editingId ? 'Editar Elemento' : 'Nuevo Elemento'}</h2>
            
            <form className="space-y-5" onSubmit={handleSaveDish}>
              {/* Foto */}
              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Subir Fotografía</label>
                <div className="border-2 border-dashed border-[#E57C5D] bg-[#FCE4D6]/10 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-[#FCE4D6]/30 transition-colors group">
                  <CloudUpload size={48} className="text-[#E57C5D] mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-[#4B2E2D] font-medium text-center">Haz clic para subir o arrastra la imagen aquí</span>
                  <span className="text-[#4B2E2D]/60 text-sm mt-1">PNG, JPG hasta 5MB</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nombre */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Nombre del Elemento</label>
                  <input 
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40"
                    placeholder="Ej: Hamburguesa Clásica"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Categoría</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all bg-white appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>Selecciona...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Precio */}
                <div>
                  <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Precio (Bs.)</label>
                  <input 
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40"
                    placeholder="0.00"
                    min="0"
                    step="0.5"
                  />
                </div>

                {/* Descripción */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Descripción</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40 resize-none"
                    placeholder="Ingredientes principales y detalles del platillo..."
                  />
                </div>
              </div>

              {/* Footer Botones */}
              <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-[#FCE4D6]">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 font-bold text-[#4B2E2D]/60 hover:bg-[#FCE4D6]/50 hover:text-[#4B2E2D] rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 bg-[#D0543A] text-white font-bold rounded-xl shadow-lg hover:bg-[#b5462f] hover:shadow-xl active:scale-[0.98] transition-all"
                >
                  {editingId ? 'Actualizar Elemento' : 'Guardar en Menú'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Elemento */}
      {itemToDelete !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FCE4D6] w-full max-w-[400px] border-[4px] border-[#D0543A] rounded-3xl p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#D0543A]/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={32} className="text-[#D0543A]" />
            </div>
            
            <h2 className="text-2xl font-bold text-[#4B2E2D] mb-3">¿Eliminar del Menú?</h2>
            
            <p className="text-[#4B2E2D]/80 mb-8 leading-relaxed font-medium">
              Esta acción no se puede deshacer y el elemento dejará de estar disponible.
            </p>
            
            <div className="flex items-center justify-center gap-4 w-full">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-3 px-4 font-bold text-[#4B2E2D] bg-transparent border-2 border-[#4B2E2D] rounded-xl hover:bg-[#4B2E2D] hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setDishes(dishes.filter(d => d.id !== itemToDelete));
                  setItemToDelete(null);
                }}
                className="flex-1 py-3 px-4 bg-[#D0543A] text-white font-bold rounded-xl shadow-lg hover:bg-[#b5462f] hover:shadow-xl active:scale-[0.98] transition-all border-2 border-[#D0543A]"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo/Editar Categoría */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-[400px] border-[6px] border-[#4B2E2D] rounded-3xl p-8 relative my-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A] transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-bold text-[#4B2E2D] mb-6">{categoryEditingId ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
            
            <form className="space-y-5" onSubmit={handleSaveCategory}>
              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Nombre de la Categoría</label>
                <input 
                  type="text"
                  required
                  value={categoryFormData.label}
                  onChange={(e) => setCategoryFormData({ label: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40"
                  placeholder="Ej: Platos Especiales"
                />
              </div>

              <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-[#FCE4D6]">
                <button 
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-6 py-3 font-bold text-[#4B2E2D]/60 hover:bg-[#FCE4D6]/50 hover:text-[#4B2E2D] rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 bg-[#D0543A] text-white font-bold rounded-xl shadow-lg hover:bg-[#b5462f] hover:shadow-xl active:scale-[0.98] transition-all"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Categoría */}
      {categoryToDelete !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FCE4D6] w-full max-w-[400px] border-[4px] border-[#D0543A] rounded-3xl p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#D0543A]/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={32} className="text-[#D0543A]" />
            </div>
            
            <h2 className="text-2xl font-bold text-[#4B2E2D] mb-3">¿Eliminar Categoría?</h2>
            
            <p className="text-[#4B2E2D]/80 mb-8 leading-relaxed font-medium">
              Esta acción no se puede deshacer.
            </p>
            
            <div className="flex items-center justify-center gap-4 w-full">
              <button 
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-3 px-4 font-bold text-[#4B2E2D] bg-transparent border-2 border-[#4B2E2D] rounded-xl hover:bg-[#4B2E2D] hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDeleteCategory(categoryToDelete)}
                className="flex-1 py-3 px-4 bg-[#D0543A] text-white font-bold rounded-xl shadow-lg hover:bg-[#b5462f] hover:shadow-xl active:scale-[0.98] transition-all border-2 border-[#D0543A]"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo/Editar Mesa */}
      {isTableModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-[400px] border-[6px] border-[#4B2E2D] rounded-3xl p-8 relative my-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsTableModalOpen(false)}
              className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A] transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-bold text-[#4B2E2D] mb-6">{tableEditingId ? 'Editar Mesa' : 'Nueva Mesa'}</h2>
            
            <form className="space-y-5" onSubmit={handleSaveTable}>
              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Identificador de la Mesa</label>
                <input 
                  type="text"
                  required
                  value={tableFormData.number}
                  onChange={(e) => setTableFormData({ ...tableFormData, number: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40"
                  placeholder="Ej: Mesa 1, Terraza A..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Capacidad (Personas)</label>
                <input 
                  type="number"
                  required
                  min="1"
                  max="20"
                  value={tableFormData.capacity}
                  onChange={(e) => setTableFormData({ ...tableFormData, capacity: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Ubicación</label>
                <select 
                  value={tableFormData.locationId}
                  onChange={(e) => setTableFormData({ ...tableFormData, locationId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all bg-white appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>Selecciona...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-[#FCE4D6]">
                <button 
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-6 py-3 font-bold text-[#4B2E2D]/60 hover:bg-[#FCE4D6]/50 hover:text-[#4B2E2D] rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 bg-[#D0543A] text-white font-bold rounded-xl shadow-lg hover:bg-[#b5462f] hover:shadow-xl active:scale-[0.98] transition-all"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Mesa */}
      {tableToDelete !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FCE4D6] w-full max-w-[400px] border-[4px] border-[#D0543A] rounded-3xl p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#D0543A]/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={32} className="text-[#D0543A]" />
            </div>
            
            <h2 className="text-2xl font-bold text-[#4B2E2D] mb-3">¿Eliminar Mesa?</h2>
            
            <p className="text-[#4B2E2D]/80 mb-8 leading-relaxed font-medium">
              Esta acción eliminará la mesa de la configuración del sistema de forma permanente.
            </p>
            
            <div className="flex items-center justify-center gap-4 w-full">
              <button 
                onClick={() => setTableToDelete(null)}
                className="flex-1 py-3 px-4 font-bold text-[#4B2E2D] bg-transparent border-2 border-[#4B2E2D] rounded-xl hover:bg-[#4B2E2D] hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setTables(tables.filter(t => t.id !== tableToDelete));
                  setTableToDelete(null);
                }}
                className="flex-1 py-3 px-4 bg-[#D0543A] text-white font-bold rounded-xl shadow-lg hover:bg-[#b5462f] hover:shadow-xl active:scale-[0.98] transition-all border-2 border-[#D0543A]"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo/Editar Ubicación */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-[500px] border-[6px] border-[#4B2E2D] rounded-3xl p-8 relative my-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsLocationModalOpen(false)}
              className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A] transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-bold text-[#4B2E2D] mb-6">Gestión de Ubicaciones</h2>
            
            {!showLocationForm ? (
              <>
                <div className="mb-6">
                  <button 
                    onClick={handleOpenAddLocationForm}
                    className="flex items-center gap-2 bg-[#D0543A] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#b5462f] hover:shadow-xl active:scale-[0.98] transition-all w-full justify-center">
                    <Plus size={20} strokeWidth={3} />
                    Añadir Ubicación
                  </button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {locations.map(loc => {
                    const tablesCount = tables.filter(t => t.locationId === loc.id).length;
                    return (
                      <div key={loc.id} className="bg-[#FCE4D6]/30 p-4 rounded-xl flex items-center justify-between group border border-transparent hover:border-[#E57C5D]/50 transition-all duration-300">
                        <div>
                          <h3 className="text-lg font-bold text-[#4B2E2D]">{loc.name}</h3>
                          <p className="text-sm text-[#4B2E2D]/60 font-medium">{tablesCount} {tablesCount === 1 ? 'mesa' : 'mesas'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleOpenEditLocationModal(loc)}
                            className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-white rounded-lg transition-all" aria-label="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => setLocationToDelete(loc.id)}
                            className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-[#D0543A]/10 rounded-lg transition-all" aria-label="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <form className="space-y-5" onSubmit={handleSaveLocation}>
                <div>
                  <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Nombre de la Ubicación</label>
                  <input 
                    type="text"
                    required
                    value={locationFormData.name}
                    onChange={(e) => setLocationFormData({ name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40"
                    placeholder="Ej: Terraza, Patio..."
                  />
                </div>

                <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-[#FCE4D6]">
                  <button 
                    type="button"
                    onClick={() => { setShowLocationForm(false); setLocationFormData({ name: '' }); }}
                    className="px-6 py-3 font-bold text-[#4B2E2D]/60 hover:bg-[#FCE4D6]/50 hover:text-[#4B2E2D] rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-[#D0543A] text-white font-bold rounded-xl shadow-lg hover:bg-[#b5462f] hover:shadow-xl active:scale-[0.98] transition-all"
                  >
                    {locationEditingId ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Eliminar Ubicación */}
      {locationToDelete !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FCE4D6] w-full max-w-[400px] border-[4px] border-[#D0543A] rounded-3xl p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#D0543A]/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={32} className="text-[#D0543A]" />
            </div>
            
            <h2 className="text-2xl font-bold text-[#4B2E2D] mb-3">¿Eliminar Ubicación?</h2>
            
            <p className="text-[#4B2E2D]/80 mb-8 leading-relaxed font-medium">
              Esta acción eliminará la ubicación y todas las mesas que pertenecen a ella de la configuración del sistema de forma permanente.
            </p>
            
            <div className="flex items-center justify-center gap-4 w-full">
              <button 
                onClick={() => setLocationToDelete(null)}
                className="flex-1 py-3 px-4 font-bold text-[#4B2E2D] bg-transparent border-2 border-[#4B2E2D] rounded-xl hover:bg-[#4B2E2D] hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDeleteLocation(locationToDelete)}
                className="flex-1 py-3 px-4 bg-[#D0543A] text-white font-bold rounded-xl shadow-lg hover:bg-[#b5462f] hover:shadow-xl active:scale-[0.98] transition-all border-2 border-[#D0543A]"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}