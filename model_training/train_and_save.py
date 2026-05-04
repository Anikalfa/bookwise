"""
Run this script ONCE to train and save the model.
Usage:
    python train_and_save.py --data_folder /path/to/RokomariBG_Dataset
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from recommender import CategoryAwarePopularityRecommender


def main():
    parser = argparse.ArgumentParser(description="Train and save the recommender model")
    parser.add_argument(
        "--data_folder",
        type=str,
        default=r"E:/RokomariBG_Dataset",
        help="Path to the dataset folder",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="model.pkl",
        help="Output path for the saved model",
    )
    args = parser.parse_args()

    USER_TO_REVIEW = os.path.join(args.data_folder, "user_to_review.json.gz")
    BOOK_TO_REVIEW = os.path.join(args.data_folder, "book_to_review.json.gz")
    BOOK_TO_CATEGORY = os.path.join(args.data_folder, "book_to_category.json.gz")

    print("Training Category-Aware Popularity Recommender...")
    model = CategoryAwarePopularityRecommender()
    model.fit(
        user_to_review_path=USER_TO_REVIEW,
        book_to_review_path=BOOK_TO_REVIEW,
        book_to_category_path=BOOK_TO_CATEGORY,
    )

    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), args.output)
    model.save(output_path)
    print(f"\n✅ Model saved to: {output_path}")
    print("You can now run the FastAPI server with: uvicorn main:app --reload")


if __name__ == "__main__":
    main()
