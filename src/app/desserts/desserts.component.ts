import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dessert } from '../data/dessert';
import { DessertFilter } from '../data/dessert-filter';
import { DessertService } from '../data/dessert.service';
import { DessertIdToRatingMap, RatingService } from '../data/rating.service';
import { DessertCardComponent } from '../dessert-card/dessert-card.component';
import { ToastService } from '../shared/toast';
import { combineLatest, debounceTime, filter, switchMap, tap } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

/*
NOTE: To get the performance improvement signals gives us,
you have to turn change detection to OnPush!!! 
*/

@Component({
  selector: 'app-desserts',
  standalone: true,
  imports: [DessertCardComponent, FormsModule, JsonPipe],
  templateUrl: './desserts.component.html',
  styleUrl: './desserts.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DessertsComponent {
  #dessertService = inject(DessertService);
  #ratingService = inject(RatingService);
  #toastService = inject(ToastService);

  originalName = signal('Pala');
  englishName = signal('');
  loading = signal(false);

  originalName$ = toObservable(this.originalName);
  englishName$ = toObservable(this.englishName);

  // Sing Observables
  desserts$ = combineLatest({
    originalName: this.originalName$,
    englishName: this.englishName$
  }).pipe(
    filter(c => c.englishName.length >= 3 || c.originalName.length >= 3),
    debounceTime(300),
    tap(() => this.loading.set(true)),
    switchMap(c => this.#dessertService.find(c)),
    tap(() => this.loading.set(false)),
  );
  ratings = signal<DessertIdToRatingMap>({});
  desserts = toSignal(this.desserts$, {
    initialValue: [],
  });

  ratedDesserts = computed(() => this.toRated(this.desserts(), this.ratings()));
  
  constructor() {
    // Can't put effect into ngOnInit, or any lifecycle method
    effect(() => {
      console.log('originalName:', this.originalName());
      console.log('englishName:', this.englishName());
    });

    effect(() => {
      this.#toastService.show(this.desserts().length + ' desserts loaded');
    })
    // ANTI-pattern of effects:
    // effect(() => {
    //   Never write to signal inside computed or effect (runtime error ensues)
    //   Using allowSignalWrites will make the runtime error go away, but having
    //   to do this probably means you have a logic error
    //   this.originalName.set(this.englishName());
    // }, {allowSignalWrites: true});

  }

  // ngOnInit(): void {
  //   this.search();
  // }

  // search(): void {
  //   const filter: DessertFilter = {
  //     originalName: this.originalName(),
  //     englishName: this.englishName(),
  //   };

  //   this.loading.set(true);

  //   this.#dessertService.find(filter).subscribe({
  //     next: (desserts) => {
  //       this.desserts.set(desserts);
  //       this.loading.set(false);
  //     },
  //     error: (error) => {
  //       this.loading.set(false);
  //       this.#toastService.show('Error loading desserts!');
  //       console.error(error);
  //     },
  //   });
  // }

  // DessertIdToRatingMap
   toRated(desserts: Dessert[], ratings: DessertIdToRatingMap): Dessert[] {
    return desserts.map((d) =>
      ratings[d.id] ? { ...d, rating: ratings[d.id] } : d,
    );
  }

  loadRatings(): void {
    this.loading.set(true);

    this.#ratingService.loadExpertRatings().subscribe({
      next: (ratings) => {
        this.ratings.set(ratings);
        this.loading.set(false);
      },
      error: (error) => {
        this.#toastService.show('Error loading ratings!');
        console.error(error);
        this.loading.set(false);
      },
    });
  }

  updateRating(id: number, rating: number): void {
    /* Could also do it this way, but using .update is recommended:
    const ratings = this.ratings();
    this.ratings.set(ratings);
    */
    this.ratings.update((ratings) => ({
      ...ratings,
      [id]: rating,
    }));
    console.log('rating changed', id, rating);
  }
}
