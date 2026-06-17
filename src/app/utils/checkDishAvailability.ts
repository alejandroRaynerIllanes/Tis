export const checkAvailability = (dish: any, recipes: any[], inventory: any[]): boolean => {
  // 1. Verificación manual (Control del Administrador)
  if (dish.disponible === false || dish.estado === 'Agotado' || dish.estado === false || dish.status === 'Agotado') {
    return false;
  }

  // Advertencia si recipes llega vacío
  if (!recipes || recipes.length === 0) {
    console.warn(`⚠️ [checkAvailability] Arreglo de recetas vacío al evaluar: ${dish.nombre || dish.name || dish.id}`);
  }

  // 2. Buscar la receta (escandallo) correspondiente al plato
  // Normalizar IDs a String para garantizar compatibilidad absoluta (Mongoose ObjectId vs String)
  const dishId = String(dish.id || dish._id || '');
  const recipe = recipes.find((r: any) => {
    const rPlatoId = String(r.plato?._id || r.plato?.id || r.plato || '');
    return rPlatoId === dishId;
  });

  // Logs temporales de depuración
  console.log(`🔍 [Disponibilidad] Plato: ${dish.nombre || dish.name || dishId} | Recetas cargadas: ${recipes?.length || 0} | Receta encontrada: ${recipe ? 'SÍ' : 'NO'}`);

  if (!recipe) {
    // La opción más segura: Si no hay receta, asumimos que es un producto simple (ej. Bebida en lata).
    // Como ya pasó la validación manual estricta del paso 1, lo consideramos disponible por configuración manual.
    return true;
  }

  // 3. Verificación de stock para cada ingrediente
  const recetaIngredientes = recipe.ingredientes;
  if (recetaIngredientes && Array.isArray(recetaIngredientes)) {
    for (const item of recetaIngredientes) {
      // Convertir a Number() para evitar fallos por comparaciones lexicográficas en JS ("50" < "100" -> false)
      const cantidadRequerida = Number(item.cantidadNecesaria || item.cantidadRequerida || item.cantidad || 0);
      const ingRef = item.ingrediente || item.item;
      
      if (!ingRef) continue;

      const ingId = String(typeof ingRef === 'object' ? (ingRef._id || ingRef.id || '') : ingRef);
      const ingNombre = typeof ingRef === 'object' ? (ingRef.nombre || ingRef.name) : null;

      const stockItem = inventory.find((inv: any) => {
        const invId = String(inv._id || inv.id || '');
        return (ingId && invId === ingId) || (ingNombre && inv.nombre === ingNombre);
      });

      const stockActual = Number(stockItem?.stockActual || 0);

      console.log(`   🔸 Ingrediente: ${ingNombre || ingId} | Stock actual: ${stockActual} | Cant. requerida: ${cantidadRequerida}`);

      // Validación matemática estricta
      if (!stockItem || stockActual < cantidadRequerida) {
        console.log(`   ❌ [AGOTADO] Inventario insuficiente para: ${ingNombre || ingId}`);
        return false;
      }
    }
  }
  
  return true;
};