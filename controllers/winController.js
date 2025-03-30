import Win from '../models/winModel.js';

/**
 * @desc Fetch win details by user
 * @route GET /api/wins/user/:userId
 * @access Private
 */
export const getUserWins = async (req, res) => {
  const { userId } = req.params;

  try {
    const wins = await Win.find({ user: userId });
    res.status(200).json(wins);
  } catch (error) {
    console.error('Error fetching user wins:', error.message);
    res.status(500).json({ message: 'Server error while fetching wins.' });
  }
};

/**
 * @desc Add a win record
 * @route POST /api/wins/add
 * @access Private
 */
export const addWinRecord = async (req, res) => {
  const { userId, marketName, gameName, betId, winningAmount } = req.body;

  if (!userId || !marketName || !gameName || !betId || !winningAmount) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const win = new Win({
      user: userId,
      marketName,
      gameName,
      bet: betId,
      winningAmount,
    });
    await win.save();

    res.status(201).json({ message: 'Win record added successfully.', win });
  } catch (error) {
    console.error('Error adding win record:', error.message);
    res.status(500).json({ message: 'Server error while adding win record.' });
  }
};
