import { getGemBalance } from '../services/wallet.service.js';
export async function gems(req, res) {
  res.json({ success: true, ...(await getGemBalance(req.user.id)) });
}
