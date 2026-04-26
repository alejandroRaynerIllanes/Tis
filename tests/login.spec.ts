import { test, expect } from '@playwright/test';

test('Debería iniciar sesión exitosamente en Sabor & Gestión', async ({ page }) => {
  // 1. Ingresar al link
  await page.goto('http://localhost:5173');

  // 2. Escribir el usuario usando el XPath que me pasaste
  const campoUsuario = page.locator('xpath=/html/body/div/div/div[3]/div/form/div[1]/div/input');
  await campoUsuario.fill('fer@sabor.com');

  // 3. Escribir la contraseña usando su XPath
  const campoPassword = page.locator('xpath=/html/body/div/div/div[3]/div/form/div[2]/div/input');
  await campoPassword.fill('123456789');

  // 4. Hacer clic en el botón de Iniciar sesión
  const botonLogin = page.locator('xpath=/html/body/div/div/div[3]/div/form/button');
  await botonLogin.click();

  // 5. Verificación (QA de oro): 
  // Esperamos un momento a que la URL cambie o que aparezca algo que confirme el éxito
  // Por ejemplo, que la URL ya no sea la de login:
  await expect(page).not.toHaveURL('http://localhost:5173');
});