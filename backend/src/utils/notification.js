// Helper to send notifications (works in both serverless and regular mode)
const sendNotification = (io, room, event, data) => {
  if (io && typeof io.to === 'function') {
    io.to(room).emit(event, data);
  } else {
    console.log(`[Notification] ${event} to ${room}:`, data);
    // In serverless, notifications won't work in real-time
    // Consider using a service like Pusher or Ably for production
  }
};

module.exports = { sendNotification };
