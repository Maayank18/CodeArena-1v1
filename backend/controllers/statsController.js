// controllers/statsController.js
import User from '../models/User.js';

export const getStats = async (req, res) => {
  try {
    // `io` isn't available here by default; we will attach live count to req.app.locals.io in server.js
    const io = req.app.locals.io;
    const live = io ? io.engine.clientsCount : 0;
    const total = await User.countDocuments();
    res.json({ live, total });
  } catch (err) {
    console.error("Error in getStats:", err);
    res.status(500).json({ message: 'Failed to read stats' });
  }
};
