// Funcoes compartilhadas. Arquivos com "_" nao viram rota no Vercel.
// Nada aqui grava dados: nome e CPF passam so pela memoria da requisicao.
const BASE = "https://api.misticpay.com/api";

// FONTE DA VERDADE DOS VALORES (o total nunca vem do navegador)
const PLANOS = {
  6: { valor: 12.0, nome: "6 latas" },
  12: { valor: 24.99, nome: "12 latas" },
};
const ENTREGAS = {
  rapida: { valor: 4.98, nome: "entrega rápida" },
  normal: { valor: 0, nome: "entrega normal" },
};

function auth() {
  const id = (process.env.MISTICPAY_CLIENT_ID || "").trim();
  const secret = (process.env.MISTICPAY_CLIENT_SECRET || "").trim();
  if (!id || !secret) throw new Error("Credenciais da MisticPay não configuradas");
  return "Basic " + Buffer.from(id + ":" + secret).toString("base64");
}

async function mp(path, body) {
  const r = await fetch(BASE + path, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = null;
  try { data = await r.json(); } catch (e) {}
  return { ok: r.ok, status: r.status, data };
}

function cpfValido(c) {
  c = String(c || "").replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (let t = 9; t < 11; t++) {
    let s = 0;
    for (let i = 0; i < t; i++) s += Number(c[i]) * (t + 1 - i);
    if (((s * 10) % 11) % 10 !== Number(c[t])) return false;
  }
  return true;
}

module.exports = { mp, PLANOS, ENTREGAS, cpfValido };
