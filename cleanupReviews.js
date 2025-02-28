const Campground = require('./models/campground')
const Review = require('./models/review')

//how to delete orphaned reviews
const cleanupReviews = async () => {
  try {
    const campgrounds = await Campground.find({});
    const campgroundIds = campgrounds.map(cg => cg._id);
    const orphanReviews = await Review.find({ _id: { $nin: campgroundIds } });

    if (orphanReviews.length > 0) {
      console.log(`Found ${orphanReviews.length} orphan reviews. Deleting...`);
      for (const review of orphanReviews) {
        await Review.findByIdAndDelete(review._id);
        console.log(`Deleted review with ID: ${review._id}`);
      }
      console.log('Cleanup complete.');
    } else {
      console.log('No orphan reviews found.');
    }
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    mongoose.connection.close();
  }
};
module.exports = cleanupReviews;