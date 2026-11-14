/**
 * STREETSIDE — SITE CONFIG
 * ---------------------------------------------------------------
 * This is the one file you should need to touch most often.
 * It holds the business details that change over time: pricing,
 * service area, contact info, and the neighbor counter / waitlist
 * form wiring. Everything here is plain data — no page markup.
 *
 * Anything marked TODO must be filled in before you consider the
 * site "launch ready." Nothing marked TODO is shown to visitors
 * as if it were real (see how each value is used in main.js).
 * ---------------------------------------------------------------
 */

window.STREETSIDE_CONFIG = {
  /**
   * SEASONAL THEME
   * ---------------
   * "thanksgiving" turns on the harvest look (burgundy/pumpkin/gold,
   * falling leaves, announcement bar). "halloween" is the spooky look.
   * Set to null to return to the normal Streetside look — nothing else
   * needs to change.
   */
  seasonalTheme: "thanksgiving", // "thanksgiving" | "halloween" | null

  business: {
    name: "Streetside",
    fullName: "Streetside Waste & Property Services",
    tagline: "We take it to the street. You don't have to.",
    serviceRegion: "Southeastern Ohio",
    contactEmail: "streetsideadmin@gmail.com",
    contactPhone: "(740) 640-6628",
    socialLinks: {
      instagram: "https://www.instagram.com/streetside_wnps",
      facebook: "https://www.facebook.com/profile.php?id=61593453727059",
      tiktok: "https://www.tiktok.com/@streetside56",
    },
  },

  /**
   * NEIGHBOR COUNTER
   * -----------------
   * `count` is the ONLY number ever shown to visitors, and it must
   * start at 0 until real signups exist — never invent a number here.
   *
   * `source` documents where the number should eventually come from.
   * Right now it's "manual" (edit `count` by hand as real people join).
   * When you have a backend, change source to "api" and set
   * `apiEndpoint` to a route that returns { count: number }; the
   * counter component (see scripts/counter.js) will fetch it instead.
   */
  neighborCounter: {
    source: "api", // "manual" | "api"
    count: 0,
    apiEndpoint: "/api/neighbor-count",
    // Optional future feature described in the brief — only turn this on
    // once a real per-route threshold exists. Leave null until then.
    nextRouteThreshold: null,
  },

  /**
   * WAITLIST FORM
   * -----------------
   * There is no backend wired up yet. `endpoint` is where the form
   * will POST its data as JSON once you connect one — for example a
   * Formspree/Getform/Basin endpoint, or your own serverless function.
   * Until `endpoint` is set, the form will NOT claim to have saved
   * anything: see scripts/waitlist-form.js for exactly what happens.
   */
  waitlistForm: {
    endpoint: "/api/waitlist",
    hearAboutUsOptions: [
      "Neighbor / word of mouth",
      "Social media",
      "Google search",
      "Flyer or mailer",
      "Local event",
      "Other",
    ],
  },

  /**
   * PRICING
   * -----------------
   * No real prices have been supplied yet. Each `price` is null and
   * the site displays a "pricing coming soon" state instead of a
   * dollar amount — see how price-card renders this in main.js.
   * Fill these in with real, approved prices before launch.
   */
  /**
   * PRICING
   * -----------------
   * Real pricing, decided by the business owner (not invented).
   * Subscription is the core offering — a flat weekly bin-out-and-back
   * service, priced per month with a per-extra-can add-on. One-time
   * service exists for people who need it just once. The Founding 250
   * offer is a real, decided promotion for the first 250 subscribers,
   * but its "spots remaining" is NOT tracked live here — there's no
   * payment/subscriber system built yet, only a waitlist. Don't wire
   * this to a live countdown until that exists; a fabricated number
   * would be worse than none.
   */
  pricingTiers: [
    {
      id: "curb",
      name: "Curb Service",
      description: "Your first bin taken from its designated storage spot to the curb before collection.",
      price: 12.5,
      billingUnit: "month",
      features: [
        "1 bin taken to the curb before collection",
        "Weekly service, every week",
        "+$10/month for each additional bin (trash or recycling)",
      ],
      featured: false,
    },
    {
      id: "full",
      name: "Full Service",
      description: "Your first bin taken to the curb before collection and returned to storage afterward.",
      price: 25,
      billingUnit: "month",
      features: [
        "Everything in Curb Service",
        "Your bin returned to storage after pickup",
        "Weekly service, every week",
        "+$10/month for each additional bin (trash or recycling)",
      ],
      featured: true,
    },
  ],

  oneTimeService: {
    name: "One-Time Service",
    description: "Need it just once — a single trip, an injury, an event? We've got you covered without a subscription.",
    price: 10,
    additionalBinPrice: 10,
    features: [
      "1 bin taken to the curb and brought back",
      "+$10 for each additional bin",
      "No subscription required",
      "Great for a one-off need",
    ],
  },

  // Snow Removal pricing (per visit). Change the numbers here and the price
  // estimator on the homepage and the signup form update automatically.
  //   ratePerSqft = dollars per square foot
  //   minimumPrice = lowest price, which covers up to minimumSqft
  // Customers type their square footage (or use "Help me measure"), and the
  // price is worked out from these numbers.
  snowRemoval: {
    ratePerSqft: 0.05,
    minimumPrice: 40,
    minimumSqft: 800,
    includes: ["Salting", "Driveways", "Sidewalks", "Walkways", "Steps", "Patios"],
  },

  // The three things Streetside offers. Shown as cards in the "Our
  // Services" section and as checkboxes on the waitlist form.
  //   status: "available" -> normal card, "coming-soon" -> Coming Soon badge
  // No prices are listed for Bin Cleaning or Snow Removal yet on purpose.
  services: [
    {
      id: "bin-valet",
      name: "Bin Valet",
      status: "available",
      description: "We take your trash and recycling bins to the curb before collection and bring them back afterward — every week.",
      cta: "Get a quote",
    },
    {
      id: "bin-cleaning",
      name: "Bin Cleaning",
      status: "coming-soon",
      description: "Pressure-washed and deodorized — no more grime, no more smell.",
      cta: "I'm interested",
    },
    {
      id: "snow-removal",
      name: "Snow Removal",
      status: "available",
      description: "Snow cleared and salted so you can get out the door and your bins can get to the curb, even in winter weather.",
      priceNote: "From $40 per visit",
      cta: "See pricing",
      ctaHref: "#snow-removal",
    },
  ],
  faq: [
    {
      q: "What exactly does Streetside do?",
      a: "Streetside moves your trash and recycling bins from their normal storage spot to the curb before your regular collection day, then returns them to storage once they've been emptied.",
    },
    {
      q: "Does Streetside collect my garbage?",
      a: "No. Streetside does not collect, haul, or dispose of garbage. Your existing waste company still collects and empties your bins — we simply handle getting them to and from the curb.",
    },
    {
      q: "When do you take my bins out?",
      a: "Before your scheduled collection day, based on the collection schedule you provide when you sign up.",
      placeholder: "Exact timing windows (e.g. evening before vs. morning of) to be finalized before launch.",
    },
    {
      q: "When do you bring them back?",
      a: "After your waste company has emptied them on collection day.",
      placeholder: "Exact same-day timing to be finalized before launch.",
    },
    {
      q: "Can I register multiple bins?",
      a: "Yes. Let us know how many trash and recycling bins you have when you sign up — your first bin is included in the base price, and each additional bin is $10/month, shown on the pricing plans above.",
    },
    {
      q: "Can Streetside handle my bins while I'm away?",
      a: "Yes — this is one of the most common reasons neighbors use Streetside. Just make sure your account reflects your normal collection schedule.",
    },
    {
      q: "Where is Streetside available?",
      a: "Streetside serves Southeastern Ohio and is opening routes neighborhood by neighborhood. Call us or request a quote and we'll tell you whether we're in your area yet.",
    },
    {
      q: "How does billing work?",
      a: "Billing is monthly, based on the plan you choose. Founding 250 members get 50% off their first month, then their regular rate for as long as they stay subscribed — locked in for 2 years.",
      placeholder: "Exact payment method/processor not yet finalized.",
    },
    {
      q: "Can I cancel?",
      a: null,
      placeholder: "Cancellation policy not yet finalized.",
    },
  ],
};


// Snow Removal price math, shared by the homepage estimator and the signup
// form so they always agree.
window.STREETSIDE_SNOW = (function () {
  var cfg = (window.STREETSIDE_CONFIG || {}).snowRemoval || {};
  function price(sqft) {
    sqft = Number(sqft);
    if (!(sqft > 0)) return null;
    return Math.max(cfg.minimumPrice, Math.round(sqft * cfg.ratePerSqft * 100) / 100);
  }
  function money(n) {
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  }
  function label(sqft) {
    var p = price(sqft);
    if (p === null) return "";
    var size = Math.round(Number(sqft)).toLocaleString("en-US") + " sq ft";
    return size + " \u2014 about " + money(p) + "/visit" + (p === cfg.minimumPrice && sqft * cfg.ratePerSqft < cfg.minimumPrice ? " (minimum)" : "");
  }
  return { price: price, money: money, label: label, cfg: cfg };
})();
