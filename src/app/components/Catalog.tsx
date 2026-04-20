import { Tag, ChefHat, Plus, Edit2, Trash2, CloudUpload, X, AlertTriangle, Users, MapPin, Shield, UserCheck, UserCog, Menu } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useState, useEffect, useRef } from 'react';

import { useAppContext } from '../context/AppContext';
import { INITIAL_CATEGORIES, INITIAL_LOCATIONS, INITIAL_USERS, MAX_VIP_TABLES } from '../data/constants';
import type { AdminView } from './layout/Sidebar';
import { Sidebar } from './layout/Sidebar';
import { Dashboard } from './admin/Dashboard';
import { ReportsSection } from './admin/ReportsSection';
import { WaiterView } from './WaiterView';
import { VIPClients } from './VIPClients';

export function Catalog() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<AdminView | 'categories' | 'locations'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { products: dishes, setProducts: setDishes, updateProductStatus, tables, setTables } = useAppContext();
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [locations, setLocations] = useState(INITIAL_LOCATIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuFilter, setMenuFilter] = useState<string>('all');

  // Refs para scroll automático a nueva categoría
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);

  // Ref para garantizar la categoría pre-seleccionada al abrir el modal de nuevo plato
  const presetCategoryRef = useRef<string>('');
  const [isPresetCategory, setIsPresetCategory] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      navigate('/waiter-view');
    }
  }, [navigate]);

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kfGVufDF8fHx8MTc3MzM3OTc2OHww&ixlib=rb-4.1.0&q=80&w=1080'
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryEditingId, setCategoryEditingId] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ label: '' });
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableEditingId, setTableEditingId] = useState<string | null>(null);
  const [tableFormData, setTableFormData] = useState({ number: '', capacity: 2, locationId: 'interior', tableType: 'normal' as 'vip' | 'normal' });
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [vipLimitError, setVipLimitError] = useState(false);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationEditingId, setLocationEditingId] = useState<string | null>(null);
  const [locationFormData, setLocationFormData] = useState({ name: '' });
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('all');

  // Estado para usuarios
  const [users, setUsers] = useState(INITIAL_USERS);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userEditingId, setUserEditingId] = useState<number | null>(null);
  const [userFormData, setUserFormData] = useState({ firstName: '', lastName: '', ci: '', email: '', role: 'Mesero', password: '' });
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  const handleOpenAddTableModal = () => {
    setTableEditingId(null);
    setTableFormData({ number: '', capacity: 2, locationId: locations.length > 0 ? locations[0].id : 'interior', tableType: 'normal' });
    setVipLimitError(false);
    setIsTableModalOpen(true);
  };

  const handleOpenEditTableModal = (table: any) => {
    setTableEditingId(table.id);
    setTableFormData({ number: table.name, capacity: table.capacity || 2, locationId: table.location, tableType: table.type || 'normal' });
    setVipLimitError(false);
    setIsTableModalOpen(true);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableFormData.number || !tableFormData.capacity) return;
    
    if (Number(tableFormData.capacity) > 20) {
      alert("La capacidad máxima de una mesa es de 20 personas.");
      return;
    }

    if (tableFormData.tableType === 'vip') {
      const currentVipTables = tables.filter(t => t.type === 'vip');
      const vipCount = tableEditingId 
        ? currentVipTables.filter(t => t.id !== tableEditingId).length 
        : currentVipTables.length;
      
      if (vipCount >= MAX_VIP_TABLES) {
        setVipLimitError(true);
        return;
      }
    }

    if (tableEditingId) {
      setTables(tables.map(t => 
        t.id === tableEditingId ? { ...t, name: tableFormData.number, capacity: Number(tableFormData.capacity), location: tableFormData.locationId, type: tableFormData.tableType } : t
      ));
    } else {
      const newId = Date.now().toString();
      setTables([...tables, { id: newId, name: tableFormData.number, capacity: Number(tableFormData.capacity), location: tableFormData.locationId, status: 'Disponible', type: tableFormData.tableType }]);
    }
    setVipLimitError(false);
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
    setLocations(locations.filter(loc => loc.id !== locationId));
    setTables(tables.filter(t => t.location !== locationId));
    setLocationToDelete(null);
  };

  // Handlers para usuarios
  const handleOpenAddUserModal = () => {
    setUserEditingId(null);
    setUserFormData({ firstName: '', lastName: '', ci: '', email: '', role: 'Mesero', password: '' });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (user: typeof INITIAL_USERS[0]) => {
    setUserEditingId(user.id);
    const nameParts = user.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    setUserFormData({ firstName, lastName, ci: '', email: user.email, role: user.role, password: '' });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.firstName || !userFormData.lastName || !userFormData.ci || !userFormData.email || !userFormData.role) return;

    const fullName = `${userFormData.firstName} ${userFormData.lastName}`;

    if (userEditingId) {
      setUsers(users.map(u =>
        u.id === userEditingId ? { ...u, name: fullName, email: userFormData.email, role: userFormData.role } : u
      ));
    } else {
      const newUser = {
        id: Date.now(),
        name: fullName,
        email: userFormData.email,
        role: userFormData.role,
        isActive: true,
      };
      setUsers([...users, newUser]);
    }
    setIsUserModalOpen(false);
  };

  const toggleUserStatus = (id: number) => {
    setUsers(users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
  };

  const handleDeleteUser = (id: number) => {
    setUsers(users.filter(u => u.id !== id));
    setUserToDelete(null);
  };

  const getRoleBadge = (role: string) => {
    if (role === 'Administrador') return { bg: 'bg-[#D0543A]/15', text: 'text-[#D0543A]', border: 'border-[#D0543A]/30', icon: <Shield size={12} /> };
    if (role === 'Mesero') return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: <UserCheck size={12} /> };
    return { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200', icon: <UserCog size={12} /> };
  };

  const toggleStatus = (id: string) => {
    const dish = dishes.find(d => d.id === id);
    if (dish) {
      updateProductStatus(id, dish.status === 'Disponible' ? 'Agotado' : 'Disponible');
    }
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
      const oldCat = categories.find(c => c.id === categoryEditingId);
      if (oldCat && oldCat.label !== categoryFormData.label) {
        setDishes(dishes.map(d => d.category === categoryEditingId ? { ...d, category: categoryFormData.label } : d));
      }
      setCategories(categories.map(cat => 
        cat.id === categoryEditingId ? { ...cat, id: categoryFormData.label, label: categoryFormData.label } : cat
      ));
    } else {
      const newId = categoryFormData.label;
      setCategories([...categories, { id: newId, label: categoryFormData.label }]);
      setMenuFilter('all');
      setNewCategoryId(newId);
    }
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
    if (menuFilter === categoryId) setMenuFilter('all');
    setCategoryToDelete(null);
  };

  const handleOpenAddModal = (preselectedCategory?: string) => {
    const preset = preselectedCategory ?? '';
    presetCategoryRef.current = preset;
    setIsPresetCategory(!!preset);
    setEditingId(null);
    setFormData({
      title: '',
      category: preset,
      description: '',
      price: '',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kfGVufDF8fHx8MTc3MzM3OTc2OHww&ixlib=rb-4.1.0&q=80&w=1080'
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isModalOpen && editingId === null && presetCategoryRef.current) {
      setFormData(prev => ({ ...prev, category: presetCategoryRef.current }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  useEffect(() => {
    if (newCategoryId) {
      const timer = setTimeout(() => {
        const el = categoryRefs.current[newCategoryId];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setNewCategoryId(null);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [newCategoryId, categories]);

  const handleOpenEditModal = (dish: any) => {
    setEditingId(dish.id);
    setIsPresetCategory(false);
    presetCategoryRef.current = '';
    setFormData({
      title: dish.name,
      category: dish.category,
      description: dish.description || '',
      price: String(dish.price),
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
          ? { ...d, name: formData.title, category: formData.category, price: Number(formData.price), image: formData.image, description: formData.description } 
          : d
      ));
    } else {
      const newDish = {
        id: Date.now().toString(),
        name: formData.title,
        category: formData.category,
        price: Number(formData.price),
        image: formData.image,
        description: formData.description,
        status: 'Disponible' as const
      };
      setDishes([...dishes, newDish]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#FCE4D6] font-sans overflow-hidden">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar extraído como componente */}
      <Sidebar
        activeView={activeView as AdminView}
        sidebarOpen={sidebarOpen}
        onViewChange={(view) => setActiveView(view)}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative min-w-0">
        {activeView === 'dashboard' ? (
          <Dashboard onOpenSidebar={() => setSidebarOpen(true)} />
        ) : activeView === 'menu' ? (
          <>
            {/* Header */}
            <header className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 sticky top-0 bg-[#FCE4D6]/90 backdrop-blur-md z-10">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-[#4B2E2D] mb-1 lg:mb-2">Gestión de Menú</h1>
            <p className="text-[#4B2E2D]/70 font-medium text-sm lg:text-base">Administra las opciones de tu menú y su disponibilidad</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-start sm:justify-end w-full sm:w-auto">
            <button
              onClick={handleOpenAddCategoryModal}
              className="flex items-center gap-2 bg-[#D0543A] text-white px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl font-bold shadow-lg shadow-[#D0543A]/30 hover:bg-[#b5462f] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98] text-sm sm:text-base whitespace-nowrap"
            >
              <Plus size={18} strokeWidth={3} />
              Añadir Categoría
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-10 pt-2 flex flex-col gap-8 lg:gap-10">

          {/* Filtros tipo chip */}
          <div className="overflow-x-auto pb-1 -mb-1">
            <div className="flex items-center gap-2 min-w-max">
              {(() => {
                const isActive = menuFilter === 'all';
                return (
                  <button
                    key="all"
                    onClick={() => setMenuFilter('all')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 whitespace-nowrap border-2 ${
                      isActive
                        ? 'bg-[#D0543A] border-[#D0543A] text-white shadow-md shadow-[#D0543A]/25'
                        : 'bg-white border-[#E57C5D]/20 text-[#4B2E2D]/60 hover:border-[#D0543A]/40 hover:text-[#4B2E2D] hover:bg-[#FCE4D6]/60'
                    }`}
                  >
                    Todos
                    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-black transition-colors ${
                      isActive ? 'bg-white/25 text-white' : 'bg-[#FCE4D6] text-[#D0543A]'
                    }`}>
                      {dishes.length}
                    </span>
                  </button>
                );
              })()}

              {categories.map(cat => {
                const count = dishes.filter(d => d.category === cat.id).length;
                const isActive = menuFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setMenuFilter(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 whitespace-nowrap border-2 ${
                      isActive
                        ? 'bg-[#D0543A] border-[#D0543A] text-white shadow-md shadow-[#D0543A]/25'
                        : 'bg-white border-[#E57C5D]/20 text-[#4B2E2D]/60 hover:border-[#D0543A]/40 hover:text-[#4B2E2D] hover:bg-[#FCE4D6]/60'
                    }`}
                  >
                    {cat.label}
                    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-black transition-colors ${
                      isActive ? 'bg-white/25 text-white' : 'bg-[#FCE4D6] text-[#D0543A]'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estado vacío global */}
          {categories.length === 0 && (
            <div className="py-20 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#FCE4D6] flex items-center justify-center mb-5">
                <Tag size={36} className="text-[#E57C5D]" />
              </div>
              <p className="font-bold text-[#4B2E2D] text-xl mb-1">No hay categorías creadas</p>
              <p className="text-[#4B2E2D]/60 font-medium mb-5 text-sm">Crea tu primera categoría para comenzar a organizar el menú</p>
              <button
                onClick={handleOpenAddCategoryModal}
                className="flex items-center gap-2 border-2 border-[#D0543A] text-[#D0543A] px-5 py-3 rounded-xl font-bold hover:bg-[#D0543A]/8 transition-all"
              >
                <Plus size={16} strokeWidth={2.5} />
                Añadir Categoría
              </button>
            </div>
          )}

          {/* Secciones por categoría */}
          {categories.filter(cat => menuFilter === 'all' || cat.id === menuFilter).map(category => {
            const categoryDishes = dishes.filter(dish => dish.category === category.id);
            
            return (
              <div
                key={category.id}
                ref={el => { categoryRefs.current[category.id] = el; }}
                className="flex flex-col gap-5"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#4B2E2D] shrink-0">{category.label}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E57C5D]/15 text-[#D0543A] border border-[#E57C5D]/25 shrink-0">
                    {categoryDishes.length} {categoryDishes.length === 1 ? 'plato' : 'platos'}
                  </span>
                  <div className="h-0.5 flex-1 bg-[#E57C5D]/25 rounded-full"></div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditCategoryModal(category)}
                      className="p-1.5 text-[#4B2E2D]/35 hover:text-[#D0543A] hover:bg-[#FCE4D6] rounded-lg transition-all"
                      title={`Editar "${category.label}"`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setCategoryToDelete(category.id)}
                      className="p-1.5 text-[#4B2E2D]/35 hover:text-[#D0543A] hover:bg-[#D0543A]/10 rounded-lg transition-all"
                      title={`Eliminar "${category.label}"`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                {categoryDishes.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                      {categoryDishes.map((dish) => (
                        <div key={dish.id} className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col group border border-transparent hover:border-[#E57C5D]/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                          <div className="relative h-56 overflow-hidden">
                            <img 
                              src={dish.image} 
                              alt={dish.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full font-bold text-[#4B2E2D] shadow-sm">
                              {dish.price} Bs.
                            </div>
                          </div>

                          <div className="p-6 flex flex-col flex-1">
                            <h3 className="text-xl font-black text-[#4B2E2D] leading-tight mb-1 line-clamp-1" title={dish.name}>{dish.name}</h3>
                            <span className="text-[11px] font-bold text-[#E57C5D] uppercase tracking-wider mb-3">
                              {categories.find(c => c.id === dish.category)?.label || dish.category}
                            </span>
                            <p className="text-[#4B2E2D]/70 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed" title={dish.description || 'Sin descripción'}>
                              {dish.description || 'Sin descripción disponible.'}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => toggleStatus(dish.id)}
                                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
                                    dish.status === 'Disponible' ? 'bg-[#E57C5D]' : 'bg-gray-300'
                                  }`}
                                >
                                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                                    dish.status === 'Disponible' ? 'translate-x-6' : 'translate-x-0'
                                  }`}></div>
                                </button>
                                <span className={`text-sm font-bold ${dish.status === 'Disponible' ? 'text-[#E57C5D]' : 'text-gray-400'}`}>
                                  {dish.status === 'Disponible' ? 'Activo' : 'Agotado'}
                                </span>
                              </div>

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
                    <div className="flex justify-start">
                      <button
                        onClick={() => handleOpenAddModal(category.id)}
                        className="flex items-center gap-1.5 text-sm font-bold text-[#D0543A] hover:bg-[#D0543A]/8 px-4 py-2 rounded-lg transition-all"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        Añadir al menú
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-8 sm:py-10 flex flex-col items-center text-center bg-white/60 rounded-2xl border-2 border-dashed border-[#E57C5D]/20 hover:border-[#E57C5D]/40 transition-colors">
                    <ChefHat size={28} className="text-[#E57C5D]/40 mb-2" />
                    <p className="text-[#4B2E2D]/45 font-medium text-sm mb-3">Esta categoría aún no tiene platos</p>
                    <button
                      onClick={() => handleOpenAddModal(category.id)}
                      className="flex items-center gap-1.5 text-sm font-bold text-[#D0543A] hover:bg-[#D0543A]/8 px-4 py-2 rounded-lg transition-all"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      Añadir al menú
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Platos sin categoría */}
          {menuFilter === 'all' && (() => {
            const categoryIds = categories.map(c => c.id);
            const uncategorized = dishes.filter(d => !categoryIds.includes(d.category));
            if (uncategorized.length === 0) return null;
            return (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#4B2E2D]/45 shrink-0 italic">Sin categoría</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200 shrink-0">
                    {uncategorized.length} {uncategorized.length === 1 ? 'plato' : 'platos'}
                  </span>
                  <div className="h-0.5 flex-1 bg-gray-200 rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {uncategorized.map((dish) => (
                    <div key={dish.id} className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col group border border-transparent hover:border-[#E57C5D]/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                      <div className="relative h-56 overflow-hidden">
                        <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full font-bold text-[#4B2E2D] shadow-sm">{dish.price} Bs.</div>
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-xl font-black text-[#4B2E2D] leading-tight mb-1 line-clamp-1">{dish.name}</h3>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Sin categoría</span>
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
              </div>
            );
          })()}

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
        ) : activeView === 'tables' ? (
          <WaiterView 
            isEmbedded 
            onAddTable={handleOpenAddTableModal}
            onManageLocations={handleOpenLocationManagerModal}
            onEditTable={handleOpenEditTableModal}
            onDeleteTable={setTableToDelete}
          />
        ) : activeView === 'users' ? (
          <>
            {/* Header Usuarios */}
            <header className="px-10 py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sticky top-0 bg-[#FCE4D6]/90 backdrop-blur-md z-10">
              <div>
                <h1 className="text-4xl font-bold text-[#4B2E2D] mb-2">Gestión de Usuarios</h1>
                <p className="text-[#4B2E2D]/70 font-medium">Administra las cuentas del personal</p>
              </div>
              <button
                onClick={handleOpenAddUserModal}
                className="flex items-center gap-2 bg-[#D0543A] text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-[#D0543A]/30 hover:bg-[#b5462f] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98]"
              >
                <Plus size={20} strokeWidth={3} />
                Nuevo Usuario
              </button>
            </header>

            <div className="p-10 pt-4">
              <div className="bg-white rounded-2xl shadow-xl border border-transparent hover:border-[#E57C5D]/30 transition-all overflow-hidden">
                <div className="px-8 py-6 border-b border-[#FCE4D6]">
                  <h2 className="text-2xl font-bold text-[#4B2E2D]">
                    Usuarios Registrados ({users.length})
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-[#FCE4D6] bg-[#FCE4D6]/20">
                        <th className="text-left py-4 px-6 font-bold text-[#4B2E2D]">Nombre</th>
                        <th className="text-left py-4 px-6 font-bold text-[#4B2E2D]">Email</th>
                        <th className="text-left py-4 px-6 font-bold text-[#4B2E2D]">Rol</th>
                        <th className="text-left py-4 px-6 font-bold text-[#4B2E2D]">Estado</th>
                        <th className="text-right py-4 px-6 font-bold text-[#4B2E2D]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const badge = getRoleBadge(user.role);
                        return (
                          <tr key={user.id} className="border-b border-[#FCE4D6] hover:bg-[#FCE4D6]/20 transition-colors">
                            <td className="py-5 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#FCE4D6] flex items-center justify-center text-[#D0543A] font-bold shrink-0">
                                  {user.name.charAt(0)}
                                </div>
                                <span className="font-bold text-[#4B2E2D]">{user.name}</span>
                              </div>
                            </td>
                            <td className="py-5 px-6 text-[#4B2E2D]/70 font-medium">{user.email}</td>
                            <td className="py-5 px-6">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                {badge.icon}
                                {user.role}
                              </span>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleUserStatus(user.id)}
                                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${user.isActive ? 'bg-[#E57C5D]' : 'bg-gray-300'}`}
                                >
                                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${user.isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                                <span className={`text-sm font-bold ${user.isActive ? 'text-[#E57C5D]' : 'text-gray-400'}`}>
                                  {user.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEditUserModal(user)}
                                  className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-[#FCE4D6] rounded-lg transition-all"
                                  aria-label="Editar usuario"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => setUserToDelete(user.id)}
                                  className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-[#D0543A]/10 rounded-lg transition-all"
                                  aria-label="Eliminar usuario"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {users.length === 0 && (
                    <div className="py-16 flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-[#FCE4D6] flex items-center justify-center mb-4">
                        <Users size={28} className="text-[#E57C5D]" />
                      </div>
                      <p className="font-bold text-[#4B2E2D] text-lg">No hay usuarios registrados</p>
                      <p className="text-[#4B2E2D]/60 font-medium mt-1">Crea el primer usuario con el botón superior</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : activeView === 'reports' ? (
          <ReportsSection />
        ) : activeView === 'vip-clients' ? (
          <VIPClients />
        ) : null}
      </main>

      {/* Modal Nuevo/Editar Usuario */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-[520px] border-[6px] border-[#4B2E2D] rounded-3xl p-8 relative my-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsUserModalOpen(false)}
              className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A] transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-3xl font-bold text-[#4B2E2D] mb-6">{userEditingId ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>

            <form className="space-y-5" onSubmit={handleSaveUser}>
              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Nombre(s)</label>
                <input
                  type="text"
                  required
                  value={userFormData.firstName}
                  onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40"
                  placeholder="Ej: Juan Carlos"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Apellido(s)</label>
                <input
                  type="text"
                  required
                  value={userFormData.lastName}
                  onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40"
                  placeholder="Ej: Pérez Gómez"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">CI</label>
                <input
                  type="text"
                  required
                  value={userFormData.ci}
                  onChange={(e) => setUserFormData({ ...userFormData, ci: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40"
                  placeholder="Ej: 12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40"
                  placeholder="correo@restaurante.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Rol</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all bg-white appearance-none cursor-pointer"
                  required
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Mesero">Mesero</option>
                  <option value="Cocinero">Cocinero</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">
                  {userEditingId ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                </label>
                <input
                  type="password"
                  required={!userEditingId}
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40"
                  placeholder={userEditingId ? 'Dejar en blanco para no cambiar' : '••••••••'}
                />
              </div>

              <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-[#FCE4D6]">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-6 py-3 font-bold text-[#4B2E2D]/60 hover:bg-[#FCE4D6]/50 hover:text-[#4B2E2D] rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-[#D0543A] text-white font-bold rounded-xl shadow-lg hover:bg-[#b5462f] hover:shadow-xl active:scale-[0.98] transition-all"
                >
                  {userEditingId ? 'Actualizar Usuario' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Usuario */}
      {userToDelete !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FCE4D6] w-full max-w-[400px] border-[4px] border-[#D0543A] rounded-3xl p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#D0543A]/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={32} className="text-[#D0543A]" />
            </div>

            <h2 className="text-2xl font-bold text-[#4B2E2D] mb-3">¿Eliminar Usuario?</h2>

            <p className="text-[#4B2E2D]/80 mb-8 leading-relaxed font-medium">
              Esta acción eliminará la cuenta del usuario de forma permanente y no se puede deshacer.
            </p>

            <div className="flex items-center justify-center gap-4 w-full">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-3 px-4 font-bold text-[#4B2E2D] bg-transparent border-2 border-[#4B2E2D] rounded-xl hover:bg-[#4B2E2D] hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(userToDelete)}
                className="flex-1 py-3 px-4 bg-[#D0543A] text-white font-bold rounded-xl shadow-lg hover:bg-[#b5462f] hover:shadow-xl active:scale-[0.98] transition-all border-2 border-[#D0543A]"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Subir Fotografía</label>
                <div className="border-2 border-dashed border-[#E57C5D] bg-[#FCE4D6]/10 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-[#FCE4D6]/30 transition-colors group">
                  <CloudUpload size={48} className="text-[#E57C5D] mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-[#4B2E2D] font-medium text-center">Haz clic para subir o arrastra la imagen aquí</span>
                  <span className="text-[#4B2E2D]/60 text-sm mt-1">PNG, JPG hasta 5MB</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                <div>
                  <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Categoría</label>
                  {isPresetCategory ? (
                    <>
                      <input type="hidden" value={formData.category} />
                      <div className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] bg-[#FCE4D6]/30 font-medium select-none cursor-default">
                        {categories.find(c => c.id === formData.category)?.label || formData.category}
                      </div>
                    </>
                  ) : (
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
                  )}
                </div>

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
                  onChange={(e) => {
                    const soloLetras = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '');
                    setCategoryFormData({ label: soloLetras });
                  }}
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
              onClick={() => { setIsTableModalOpen(false); setVipLimitError(false); }}
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

              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Tipo de Mesa</label>
                <select 
                  value={tableFormData.tableType}
                  onChange={(e) => {
                    setTableFormData({ ...tableFormData, tableType: e.target.value as 'vip' | 'normal' });
                    setVipLimitError(false);
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all bg-white appearance-none cursor-pointer"
                  required
                >
                  <option value="normal">Normal</option>
                  <option value="vip">VIP</option>
                </select>
              </div>

              {vipLimitError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-red-700">
                    Límite alcanzado: solo se permiten hasta {MAX_VIP_TABLES} mesas VIP
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-[#FCE4D6]">
                <button 
                  type="button"
                  onClick={() => { setIsTableModalOpen(false); setVipLimitError(false); }}
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

      {/* Modal Gestión de Ubicaciones */}
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
                    const tablesCount = tables.filter(t => t.location === loc.id).length;
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
