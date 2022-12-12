"use strict";
/*jshint esversion: 10*/
export default class RatingStars{
	constructor(markerId){
		this.TAG = "RatingStars";
        this.markerId = markerId;
        this.star_rating = document.getElementById(`rating-el-${markerId}`);
        this.starComponent = star_rating.querySelector(".star-rating");
        this.starRatingInput = star_rating.querySelector(".rating-value");
        this.rating = starRatingInput.value;
    }
    init(){

    }
    getStarComponent(avgStarRating){
	    let starHtml = `<div id="rating-el-${this.markerId}">
            <div class="row">
                <div class="col-lg-12">
                    <div class="star-rating text-center pt-2">
                        <span class="bi bi-${(avgStarRating<=1)?"star":"star-fill"}" data-rating="1"></span>
                        <span class="bi bi-${(avgStarRating<=2)?"star":"star-fill"}" data-rating="2"></span>
                        <span class="bi bi-${(avgStarRating<=3)?"star":"star-fill"}" data-rating="3"></span>
                        <span class="bi bi-${(avgStarRating<=4)?"star":"star-fill"}" data-rating="4"></span>
                        <span class="bi bi-${(avgStarRating<=5)?"star":"star-fill"}" data-rating="5"></span>
                        <input type="hidden" name="rating-value" class="rating-value" value="${avgStarRating}">
                    </div>
                </div>
            </div>
        </div>`;
        return starHtml;
    }
	resetTabIndex = () => {
		this.starComponent.childNodes.forEach((star) => {
            star.tabIndex = -1;
        });
    }
	
    activate = (element) => {
        this.resetTabIndex();
        element.tabIndex = 0;
        element.focus();
    }

	changeRating = (newRating) => {
        this.rating = newRating;
		starRatingInput.value = this.rating;
        newMapMarkers[markerId].starRating = this.rating;
        storeStarRating(newMapMarkers[markerId].houseId, {"starRating":this.rating,"currentMarkerId":this.markerId});
    }
	getRating = () => {
        return rating;
    }
	renderRating = (rating) => {
		for (let index = 0; index < rating; index++) {
			this.starComponent.children[index].classList.add("bi-star-fill");
			this.starComponent.children[index].classList.remove("bi-star");
		}
		for (let index = rating; index < 5; index++) {
			this.starComponent.children[index].classList.remove("bi-star-fill");
			this.starComponent.children[index].classList.add("bi-star");
		}
	}
	
    addEventListeners = () => {
        this.star_rating.addEventListener("click", (event)=>{
            let star = event.target ?? event;
            let isStar = star.classList.contains("bi");
            if (isStar) { 
                this.activate(star);
                let { rating } = star.dataset;
                if(event.key!=='Tab' && rating === this.getRating()){
                    rating = 0;
                    this.resetTabIndex();
                    this.starComponent.firstElementChild.tabIndex = 0; 
                }
                this.changeRating(rating);
                this.renderRating(rating);
            }
        });
        this.star_rating.addEventListener("mouseover", (event)=>{
            let isStar = event.target.classList.contains("bi");
            if (isStar) {
                const { rating } = event.target.dataset;
                this.renderRating(rating);
            }
        });
        this.star_rating.addEventListener("mouseout", (event)=>{
            this.renderRating(this.rating);
        });
        this.star_rating.addEventListener("load", (event)=>{
            this.renderRating(this.rating);
        });
    }
}
