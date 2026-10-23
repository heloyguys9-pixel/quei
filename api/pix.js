// POST /api/pix -> cria a cobrança PIX na MisticPay e devolve o QR Code.
// Recebe SÓ o que a API exige (nome e CPF do pagador) + oferta e entrega.
// Endereço e telefone nem chegam aqui. Nada é salvo nem registrado em log.
const { mp, PLANOS, ENTREGAS, cpfValido } = require("./_mp");
const limpa = (s, n) => String(s || "").trim().slice(0, n);

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido." });
  const b = req.body || {};

  const plano = PLANOS[Number(b.plano)];
  const entrega = ENTREGAS[String(b.entrega)];
  if (!plano || !entrega) return res.status(400).json({ erro: "Oferta ou entrega inválida." });

  const nome = limpa(b.nome, 60), sobrenome = limpa(b.sobrenome, 80);
  const cpf = String(b.cpf || "").replace(/\D/g, "");
  if (!nome || !sobrenome) return res.status(400).json({ erro: "Informe nome e sobrenome." });
  if (!cpfValido(cpf)) return res.status(400).json({ erro: "CPF inválido." });

  const total = Math.round((plano.valor + entrega.valor) * 100) / 100;
  // Identificador exigido para consultar o status depois (/transactions/check). Não é um sistema de pedidos.
  const id = "LULA-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);

  let r;
  try {
    r = await mp("/transactions/create", {
      amount: total,
      payerName: nome + " " + sobrenome,
      payerDocument: cpf,
      transactionId: id,
      description: "Bebida do Lula - " + plano.nome + " - " + entrega.nome,
    });
  } catch (err) {
    console.error("Erro ao chamar a MisticPay:", err.message);
    return res.status(502).json({ erro: "Não foi possível gerar o PIX agora. Tente novamente." });
  }
  const d = r.data && r.data.data;
  if (!r.ok || !d) {
    // log sem dados pessoais: só status, código e requestId
    console.error("MisticPay create falhou:", r.status, r.data && r.data.code, r.data && r.data.requestId);
    return res.status(502).json({ erro: "Não foi possível gerar o PIX agora. Tente novamente." });
  }
  return res.status(200).json({
    id, altId: String(d.transactionId || ""), valor: total,
    qrCodeBase64: d.qrCodeBase64 || "", qrcodeUrl: d.qrcodeUrl || "", copyPaste: d.copyPaste || "",
  });
};
