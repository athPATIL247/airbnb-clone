const PAGES = {
    help: { title: "Help Centre", heading: "Help Centre", body: "Demo content: browse common questions about bookings, hosting, and your account." },
    privacy: { title: "Privacy", heading: "Privacy Policy", body: "Demo content: Airbnb explains how listing and account data would be used on a production site." },
    terms: { title: "Terms", heading: "Terms of Service", body: "Demo content: these terms describe using Airbnb listings, reviews, and payments in a real product." },
    sitemap: { title: "Sitemap", heading: "Sitemap", body: "Demo content: Home, listings, hosting, help, privacy, and terms would appear here." },
    cancellation: { title: "Cancellation options", heading: "Cancellation options", body: "Demo content: hosts set their own cancellation windows. Free cancellation before check-in is shown on listing pages." },
    safety: { title: "Safety", heading: "Safety resources", body: "Demo content: report a neighbourhood concern or a safety issue from this help area." },
    careers: { title: "Careers", heading: "Careers", body: "Demo content: Airbnb is a student project. There are no open roles." },
    newsroom: { title: "Newsroom", heading: "Newsroom", body: "Demo content: product updates and community stories would be published here." },
    hosting: { title: "Hosting", heading: "Hosting resources", body: "Demo content: tips for writing titles, photographing your place, and welcoming guests." },
    community: { title: "Community", heading: "Community forum", body: "Demo content: hosts and guests would discuss neighbourhoods and house rules here." }
};

module.exports.show = (req, res, next) => {
    const page = PAGES[req.params.slug];
    if (!page) return next();
    res.render("pages/page.ejs", { page, title: page.title, pageClass: "page-static", currUser: req.user });
};
