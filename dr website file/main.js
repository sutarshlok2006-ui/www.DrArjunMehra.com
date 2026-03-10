// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== MOBILE MENU =====
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if(hamburger) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close menu on link click
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // ===== BACK TO TOP =====
    const backToTop = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function() {
        if(window.scrollY > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });
    
    if(backToTop) {
        backToTop.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== LOAD REVIEWS FROM JSON =====
    loadReviews();
    
    // ===== DOWNLOAD PROFILE =====
    const downloadBtn = document.getElementById('downloadProfile');
    
    if(downloadBtn) {
        downloadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const profileContent = `DR. ARJUN MEHRA - DENTAL PROFILE
================================

PERSONAL INFORMATION
-------------------
Name: Dr. Arjun Mehra
Qualification: BDS, MDS (Prosthodontics)
Experience: 15+ Years
Specialization: Dental Implants, Root Canal, Cosmetic Dentistry

EDUCATION
---------
• MDS in Prosthodontics - Nair Hospital Dental College, Mumbai
• BDS - Government Dental College, Mumbai

CERTIFICATIONS
-------------
• Advanced Laser Dentistry - Germany
• Invisalign Certified Provider
• Member of Indian Dental Association

ACHIEVEMENTS
-----------
• 2500+ Successful Implants
• 5000+ Happy Patients
• 4.9 Star Rating

CONTACT
-------
📞 +91 98765 43210
📧 dr.arjun@smileclinic.in
📍 Chembur East, Mumbai

Book Appointment: https://wa.me/919876543210`;
            
            const blob = new Blob([profileContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Dr_Arjun_Mehra_Profile.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            alert('✅ Profile downloaded successfully!');
        });
    }
});

// ===== MAIN FUNCTION TO LOAD REVIEWS =====
function loadReviews() {
    const reviewsContainer = document.getElementById('reviewsContainer');
    
    if(!reviewsContainer) return;
    
    // Show loading
    reviewsContainer.innerHTML = '<div class="loading-reviews"><i class="fas fa-spinner fa-spin"></i> Loading reviews...</div>';
    
    // Try to fetch from JSON file
    fetch('reviews.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            displayReviews(data.reviews);
        })
        .catch(error => {
            console.log('Error loading reviews.json, using default reviews:', error);
            // Use default reviews if JSON fails
            const defaultReviews = [
                {
                    name: "Rajesh Sharma",
                    rating: 5,
                    treatment: "Root Canal",
                    date: "15 Jan 2024",
                    review: "Dr. Arjun ne mera root canal kiya, bilkul pain nahi hua. Bahut professional clinic hai. Staff bhi bahut friendly hai."
                },
                {
                    name: "Priya Gupta",
                    rating: 5,
                    treatment: "Dental Implant",
                    date: "10 Jan 2024",
                    review: "Implant karwaya, 2 saal ho gaye bilkul natural tooth jaisa hai. Thank you team! Highly recommended."
                },
                {
                    name: "Amit Kumar",
                    rating: 5,
                    treatment: "Teeth Whitening",
                    date: "5 Jan 2024",
                    review: "Teeth whitening karwaya, bahut accha result aaya. 1 sitting mein hi 8 shades brighter ho gaye."
                },
                {
                    name: "Sneha Patel",
                    rating: 5,
                    treatment: "Scaling",
                    date: "2 Jan 2024",
                    review: "Clinic bahut clean hai. Dr. Arjun ne scaling kiya, ab gums healthy feel ho rahi hai."
                },
                {
                    name: "Rahul Verma",
                    rating: 5,
                    treatment: "Root Canal",
                    date: "28 Dec 2023",
                    review: "Best dentist in Chembur. Painless treatment aur reasonable prices."
                }
            ];
            displayReviews(defaultReviews);
        });
}

// ===== DISPLAY REVIEWS ON PAGE =====
function displayReviews(reviews) {
    const reviewsContainer = document.getElementById('reviewsContainer');
    
    if(!reviewsContainer) return;
    
    let html = '<div class="reviews-grid">';
    
    // Show only last 6 reviews (reverse chronological)
    const recentReviews = reviews.slice(-6).reverse();
    
    recentReviews.forEach(review => {
        // Generate stars
        let stars = '';
        for(let i = 1; i <= 5; i++) {
            if(i <= review.rating) {
                stars += '<i class="fas fa-star"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        
        html += `
            <div class="review-card">
                <div class="review-header">
                    <div class="reviewer-info">
                        <h4>${review.name}</h4>
                        <span class="review-date">${review.date}</span>
                    </div>
                    <div class="review-rating">
                        ${stars}
                    </div>
                </div>
                <div class="review-treatment">
                    <span class="treatment-badge">${review.treatment}</span>
                </div>
                <p class="review-text">"${review.review}"</p>
                <div class="review-footer">
                    <i class="fab fa-whatsapp"></i>
                    <span>Verified via WhatsApp</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    reviewsContainer.innerHTML = html;
}