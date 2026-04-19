/* 
   ================================================================
   CENTRAL CONFIGURATION FILE (VTT Project)
   ================================================================
   Use this file to easily edit the website's settings without 
   touching HTML or complex CSS code.

   1. ADMIN: Change your dashboard password here.
   2. SUPABASE: Link your database (URL & ANON_KEY).
   3. GENERAL: Update your Email, Phone, and Social Media links.
   4. UPI: Change the donation account details.
   ================================================================
*/

const PAYMENT_CONFIG = {
    // UPI Details
    UPI: {
        ID: "8248678722@nyes",
        NAME: "Prasanth",
        CURRENCY: "INR",
        get LINK() {
            return `upi://pay?pa=${this.ID}&pn=${encodeURIComponent(this.NAME)}&cu=${this.CURRENCY}`;
        }
    },

    // Razorpay Details
    RAZORPAY: {
        KEY_ID: "rzp_test_YourKeyHere", // Replace with actual key in production
        THEME_COLOR: "#c0622f"
    },

    // Supabase Database Config
    SUPABASE: {
        URL: "https://voeexzppfklinbfbhxsx.supabase.co",
        ANON_KEY: "sb_publishable_mCRVyNKBxwyjguU0cCZ0Jw_Hfdrzswh"
    },

    // Admin Config
    ADMIN: {
        PASSWORD: "prasanth" // Default password
    },

    // General Website Config
    GENERAL: {
        NAME: "Virtual Tribal Tourism",
        EMAIL: "info@gardencity.university",
        PHONE: "+91 98765 43210",
        LOCATION: "Bengaluru, Karnataka, India",
        SOCIAL: {
            INSTAGRAM: "https://www.instagram.com/gardencityuniversity/",
            YOUTUBE: "https://youtube.com/@karnatakatribaltourism?si=54V5Ps1jfdJcpg6j",
            LINKEDIN: "https://www.linkedin.com/school/garden-city-university/",
            FACEBOOK: "https://www.facebook.com/gardencityuniversity/"
        }
    }
};

// Freeze object to prevent runtime modification
Object.freeze(PAYMENT_CONFIG);
Object.freeze(PAYMENT_CONFIG.UPI);
Object.freeze(PAYMENT_CONFIG.RAZORPAY);
Object.freeze(PAYMENT_CONFIG.SUPABASE);
Object.freeze(PAYMENT_CONFIG.ADMIN);
Object.freeze(PAYMENT_CONFIG.GENERAL);
Object.freeze(PAYMENT_CONFIG.GENERAL.SOCIAL);
