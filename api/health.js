export default (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
};
