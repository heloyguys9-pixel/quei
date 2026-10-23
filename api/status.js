// POST /api/status -> status REAL da cobrança na MisticPay (PENDENTE, COMPLETO, FALHA...)
const { mp } = require("./_mp");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const b = req.body || {};
  const id = String(b.id || "").slice(0, 100), alt = String(b.alt || "").slice(0, 100);
  if (!id) return res.status(400).json({ erro: "ID ausente." });
  try {
    let r = await mp("/transactions/check", { transactionId: id });
    if (!r.ok && alt) r = await mp("/transactions/check", { transactionId: alt });
    const t = r.data && r.data.transaction;
    if (!r.ok || !t) {
      console.error("check falhou:", r.status, r.data && r.data.code, r.data && r.data.requestId);
      return res.status(200).json({ estado: null });
    }
    return res.status(200).json({ estado: t.transactionState });
  } catch (err) {
    console.error("Erro no status:", err.message);
    return res.status(200).json({ estado: null });
  }
};
