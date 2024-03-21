import {
  Component,
  OnChanges,
  computed,
  model,
  output,
  signal,
} from '@angular/core';

const maxRatingInCheatMode = 500;

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [],
  templateUrl: './rating.component.html',
  styleUrl: './rating.component.css',
})
export class RatingComponent implements OnChanges {
  // rating = input(0);
  // model used for 2-way data binding
  // If required, cannot set default value. If not required, need to set default value
  rating = model.required<number>();
  ratingChange = output<number>();

  maxRating = signal(5);
  // maxRating = computed(() => this.rating() > this.maxRating() ? maxRatingInCheatMode : 5);
  stars = computed(() => this.toStars(this.rating(), this.maxRating()));

  
  // getMaxRating(rating: number, maxRating: number): number {
  //   if (rating > maxRating) {
  //     this.maxRating.set( maxRatingInCheatMode);
  //   }

  // }
  ngOnChanges(): void {
    if (this.rating() > this.maxRating()) {
      this.maxRating.set( maxRatingInCheatMode);
    }
  }

  // ECMA standard now says # means it's a private method on the class!
  // #updateStars() {
    // No longer need this because of the computed method
  //   this.stars = this.toStars(this.rating(), this.maxRating);
  // }

  private toStars(rating: number, maxRating: number): Array<boolean> {
    const stars = new Array<boolean>(rating);
    for (let i = 0; i < maxRating; i++) {
      stars[i] = i < rating;
    }
    return stars;
  }

  rate(rating: number): void {
    this.rating.set(rating);
    // this.#updateStars();
    // Since it's a model signal, no need to call .next
    // this.rating.next(rating);
  }

  enterCheatMode() {
    this.maxRating.set(maxRatingInCheatMode);
  }
}
