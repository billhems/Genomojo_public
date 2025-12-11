// Firestore trigger for real-time vote counting (v2 - distributed counters)
const { onVoteCreated } = require("./onVoteCreated");
const { onUserCreated } = require("./onUserCreated");
const { onMojoItemCreated } = require("./onMojoItemCreated");

// Export the triggers
exports.onVoteCreated = onVoteCreated;
exports.onUserCreated = onUserCreated;
exports.onMojoItemCreated = onMojoItemCreated;

// ===== OLD IMPLEMENTATION (Deprecated) =====
// The scheduled aggregation is replaced by the onVoteCreated trigger above.
// Keep commented for rollback if needed.
//
// const { onSchedule } = require("firebase-functions/v2/scheduler");
// const { aggregateVotes } = require("./voteAggregator");
// 
// exports.aggregateVotes = onSchedule("every 1 minutes", async (event) => {
//     await aggregateVotes(event);
// });
