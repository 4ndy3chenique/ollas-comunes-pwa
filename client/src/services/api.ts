const BASE_URL = 'http://localhost:3000/api';

export const api = {
  // Login dirigente
  login: async (identificador: { dni?: string; email?: string }) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(identificador),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Error de autenticación');
    return res.json();
  },

  // Obtener datos de la olla común
  getOlla: async (ollaId: number) => {
    const res = await fetch(`${BASE_URL}/ollas/${ollaId}`);
    if (!res.ok) throw new Error('Error al obtener datos de la olla');
    return res.json();
  },

  // Obtener padrón de beneficiarios
  getBeneficiarios: async (ollaId: number) => {
    const res = await fetch(`${BASE_URL}/ollas/${ollaId}/beneficiarios`);
    if (!res.ok) throw new Error('Error al obtener beneficiarios');
    return res.json();
  },

  // Registrar nuevo beneficiario
  crearBeneficiario: async (ollaId: number, data: any) => {
    const res = await fetch(`${BASE_URL}/ollas/${ollaId}/beneficiarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al registrar beneficiario');
    return res.json();
  },
};