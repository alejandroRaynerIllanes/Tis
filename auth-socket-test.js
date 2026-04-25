(async ()=>{
  const res = await fetch('http://localhost:3000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@sabor.com', password: 'admin123' }) });
  const data = await res.json();
  const token = data.token;
  console.log('token present:', bash -lc cd
