const STORAGE_KEY = "sfc-mock-db";

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const uid = (prefix) => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const svgDataUri = (label, bg = "#0f172a", fg = "#ffffff") =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" fill="${fg}" font-size="34" font-family="Arial" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
  )}`;

const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

const buildMapsUrl = (item = {}) => {
  if (typeof item.latitude === "number" && typeof item.longitude === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    item.fullAddress || item.location || "India"
  )}`;
};

const distanceKm = (aLat, aLng, bLat, bLng) => {
  if ([aLat, aLng, bLat, bLng].some((value) => typeof value !== "number")) {
    return null;
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const nowIso = () => new Date().toISOString();

const tokenForUser = (userId) => `mock-token-${userId}`;

const seedDatabase = () => {
  const adminId = uid("user");
  const providerId = uid("user");
  const ngoId = uid("user");
  const foodId = uid("food");
  const verificationId = uid("verification");

  return {
    users: [
      {
        _id: adminId,
        name: "Admin Demo",
        email: "admin@sfc.demo",
        password: "admin123",
        role: "admin",
        location: "Pune",
        fullAddress: "Control Room, Pune",
        latitude: 18.5204,
        longitude: 73.8567,
        trustScore: 100,
        totalContributions: 0
      },
      {
        _id: providerId,
        name: "Fresh Kitchen",
        email: "provider@sfc.demo",
        password: "provider123",
        role: "provider",
        location: "Pune",
        fullAddress: "FC Road, Pune",
        latitude: 18.5204,
        longitude: 73.8567,
        trustScore: 92,
        totalContributions: 14
      },
      {
        _id: ngoId,
        name: "Helping Hands NGO",
        email: "ngo@sfc.demo",
        password: "ngo123",
        role: "ngo",
        location: "Pune",
        fullAddress: "Shivaji Nagar, Pune",
        latitude: 18.5314,
        longitude: 73.8446,
        trustScore: 95,
        totalContributions: 21
      }
    ],
    foodListings: [
      {
        _id: foodId,
        providerId,
        foodName: "Veg Biryani Packs",
        quantity: 25,
        location: "Pune",
        fullAddress: "FC Road, Pune",
        latitude: 18.5204,
        longitude: 73.8567,
        expiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        status: "available",
        sourceType: "event",
        homeTermsAccepted: true,
        eventProofFileUrl: svgDataUri("Event Proof", "#0369a1")
      }
    ],
    claims: [],
    proofs: [],
    complaints: [],
    verifications: [
      {
        _id: verificationId,
        userId: providerId,
        role: "provider",
        status: "verified",
        locationSnapshot: {
          location: "Pune",
          fullAddress: "FC Road, Pune"
        },
        documents: [
          {
            label: "Business Proof",
            fileUrl: svgDataUri("Business Proof", "#0f766e")
          },
          {
            label: "Food Safety Certificate",
            fileUrl: svgDataUri("Food Safety", "#1d4ed8")
          }
        ],
        expiryTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        selfDeclarationAccepted: true,
        adminNotes: ""
      }
    ]
  };
};

const readDb = () => {
  const storage = getStorage();

  if (!storage) {
    return seedDatabase();
  }

  const raw = storage.getItem(STORAGE_KEY);

  if (!raw) {
    const seeded = seedDatabase();
    storage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    const seeded = seedDatabase();
    storage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
};

const writeDb = (db) => {
  const storage = getStorage();

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  token: tokenForUser(user._id),
  location: user.location || "",
  fullAddress: user.fullAddress || "",
  latitude: user.latitude,
  longitude: user.longitude,
  trustScore: user.trustScore || 0,
  totalContributions: user.totalContributions || 0
});

const getUserFromToken = (db, token) => {
  if (!token) {
    return null;
  }

  const userId = token.replace("mock-token-", "");
  return db.users.find((user) => user._id === userId) || null;
};

const parseBody = async (body) => {
  if (!body) {
    return {};
  }

  if (body instanceof FormData) {
    const data = {};

    for (const [key, value] of body.entries()) {
      data[key] = value;
    }

    return data;
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch (error) {
      return {};
    }
  }

  return body;
};

const fileToDataUrl = (file) =>
  new Promise((resolve) => {
    if (!(file instanceof File)) {
      resolve(typeof file === "string" ? file : "");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });

const createDocumentsFromPayload = async (payload, mapping) => {
  const documents = [];

  for (const [field, label] of mapping) {
    if (payload[field]) {
      const fileUrl = await fileToDataUrl(payload[field]);
      documents.push({
        label,
        fileUrl: fileUrl || svgDataUri(label)
      });
    }
  }

  return documents;
};

const getVerificationForUser = (db, userId) =>
  db.verifications.find((item) => item.userId === userId) || null;

const hydrateFood = (db, food, viewer = null) => {
  const provider = db.users.find((user) => user._id === food.providerId);
  const distanceScore = viewer
    ? distanceKm(viewer.latitude, viewer.longitude, food.latitude, food.longitude)
    : null;

  return {
    ...food,
    provider: provider ? sanitizeUser(provider) : null,
    providerName: provider?.name || "Provider",
    providerTrustScore: provider?.trustScore || 0,
    distanceScore,
    mapsUrl: buildMapsUrl(food)
  };
};

const hydrateClaim = (db, claim) => {
  const food = db.foodListings.find((item) => item._id === claim.foodId);
  const provider = db.users.find((item) => item._id === claim.providerId);
  const ngo = db.users.find((item) => item._id === claim.ngoId);
  const proof = db.proofs.find((item) => item.claimId === claim._id);

  return {
    ...claim,
    foodId: food ? hydrateFood(db, food, ngo || provider) : null,
    provider: provider ? sanitizeUser(provider) : null,
    ngo: ngo ? sanitizeUser(ngo) : null,
    proof: proof
      ? {
          ...proof,
          ngo: ngo ? sanitizeUser(ngo) : null
        }
      : null
  };
};

const hydrateProof = (db, proof) => {
  const claim = db.claims.find((item) => item._id === proof.claimId);
  const ngo = db.users.find((item) => item._id === proof.ngoId);

  return {
    ...proof,
    claim: claim
      ? {
          ...claim,
          foodId: claim.foodId
            ? hydrateFood(
                db,
                db.foodListings.find((item) => item._id === claim.foodId) || {},
                ngo || null
              )
            : null
        }
      : null,
    ngo: ngo ? sanitizeUser(ngo) : null
  };
};

const hydrateComplaint = (db, complaint) => {
  const claim = db.claims.find((item) => item._id === complaint.claimId);
  const provider = db.users.find((item) => item._id === complaint.providerId);
  const ngo = db.users.find((item) => item._id === complaint.ngoId);

  return {
    ...complaint,
    claim: claim ? hydrateClaim(db, claim) : null,
    provider: provider ? sanitizeUser(provider) : null,
    ngo: ngo ? sanitizeUser(ngo) : null
  };
};

const hydrateVerification = (db, verification) => {
  const user = db.users.find((item) => item._id === verification.userId);

  return {
    ...verification,
    user: user ? sanitizeUser(user) : null
  };
};

const saveAndReturnUser = (db, user) => {
  writeDb(db);
  return sanitizeUser(user);
};

const handleAuthLogin = async (db, payload) => {
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");
  const user = db.users.find((item) => item.email.toLowerCase() === email);

  if (!user) {
    throw new Error("User not found. Register with any email and password to continue.");
  }

  if (user.password !== password) {
    throw new Error("Incorrect password.");
  }

  return sanitizeUser(user);
};

const handleAuthRegister = async (db, payload) => {
  const email = String(payload.email || "").trim().toLowerCase();

  if (!email || !payload.password || !payload.role) {
    throw new Error("Email, password and role are required.");
  }

  if (db.users.some((item) => item.email.toLowerCase() === email)) {
    throw new Error("This email is already registered. Please login.");
  }

  const user = {
    _id: uid("user"),
    name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    email,
    password: String(payload.password),
    role: payload.role,
    location: payload.role === "ngo" ? "Pune" : "Pune",
    fullAddress: payload.role === "ngo" ? "Community Center, Pune" : "Provider Hub, Pune",
    latitude: 18.5204,
    longitude: 73.8567,
    trustScore: payload.role === "ngo" ? 75 : 70,
    totalContributions: 0
  };

  db.users.push(user);
  return saveAndReturnUser(db, user);
};

const handleProfileUpdate = async (db, currentUser, payload) => {
  Object.assign(currentUser, {
    name: payload.name ?? currentUser.name,
    location: payload.location ?? currentUser.location,
    fullAddress: payload.fullAddress ?? currentUser.fullAddress,
    latitude:
      payload.latitude === "" || payload.latitude === undefined
        ? currentUser.latitude
        : Number(payload.latitude),
    longitude:
      payload.longitude === "" || payload.longitude === undefined
        ? currentUser.longitude
        : Number(payload.longitude)
  });

  return saveAndReturnUser(db, currentUser);
};

const handleFoodCreate = async (db, currentUser, payload) => {
  const verification = getVerificationForUser(db, currentUser._id);
  const reusableProof = verification?.documents?.[0]?.fileUrl || svgDataUri("Source Proof", "#155e75");
  const listing = {
    _id: uid("food"),
    providerId: currentUser._id,
    foodName: payload.foodName || "Food Listing",
    quantity: Number(payload.quantity || 0) || payload.quantity || 1,
    location: payload.location || currentUser.location || "Pune",
    fullAddress: payload.fullAddress || currentUser.fullAddress || "Pune",
    latitude:
      payload.latitude === "" || payload.latitude === undefined
        ? currentUser.latitude
        : Number(payload.latitude),
    longitude:
      payload.longitude === "" || payload.longitude === undefined
        ? currentUser.longitude
        : Number(payload.longitude),
    expiryTime: payload.expiryTime || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    status: "available",
    sourceType: payload.sourceType || "home",
    homeTermsAccepted: String(payload.homeTermsAccepted) === "true",
    eventProofFileUrl: reusableProof
  };

  db.foodListings.unshift(listing);
  currentUser.totalContributions = (currentUser.totalContributions || 0) + 1;
  writeDb(db);
  return hydrateFood(db, listing, currentUser);
};

const handleClaimCreate = async (db, currentUser, payload) => {
  const food = db.foodListings.find((item) => item._id === payload.foodId);

  if (!food) {
    throw new Error("Food listing not found.");
  }

  if (food.status !== "available") {
    throw new Error("This listing is no longer available.");
  }

  food.status = "claimed";

  const claim = {
    _id: uid("claim"),
    foodId: food._id,
    providerId: food.providerId,
    ngoId: currentUser._id,
    timestamp: nowIso()
  };

  db.claims.unshift(claim);
  writeDb(db);
  return hydrateClaim(db, claim);
};

const handleProofCreate = async (db, currentUser, payload) => {
  const claim = db.claims.find((item) => item._id === payload.claimId);

  if (!claim) {
    throw new Error("Claim not found.");
  }

  const existingProof = db.proofs.find((item) => item.claimId === claim._id);
  const imageUrl = await fileToDataUrl(payload.image);
  const submittedAt = nowIso();

  const nextProof = {
    _id: existingProof?._id || uid("proof"),
    claimId: claim._id,
    ngoId: currentUser._id,
    status: "pending",
    notes: payload.notes || "",
    imageUrl: imageUrl || svgDataUri("Proof Image", "#334155"),
    geoTagLocation: payload.geoTagLocation || currentUser.location || "",
    geoTagMatched: true,
    submittedWithinDeadline: true,
    createdAt: submittedAt
  };

  if (existingProof) {
    Object.assign(existingProof, nextProof);
  } else {
    db.proofs.unshift(nextProof);
  }

  writeDb(db);
  return hydrateProof(db, nextProof);
};

const handleVerificationUpload = async (db, currentUser, payload) => {
  const isProvider = currentUser.role === "provider";
  const documents = await createDocumentsFromPayload(
    payload,
    isProvider
      ? [
          ["foodSafetyCertificate", "Food Safety Certificate"],
          ["businessProof", "Business Proof"],
          ["foodPreparationProof", "Kitchen Proof"]
        ]
      : [
          ["ngoRegistrationCertificate", "NGO Registration Certificate"],
          ["idProof", "Lead ID Proof"]
        ]
  );

  const existing = getVerificationForUser(db, currentUser._id);
  const verification = existing || {
    _id: uid("verification"),
    userId: currentUser._id,
    role: currentUser.role
  };

  Object.assign(verification, {
    status: existing?.status === "verified" ? "verified" : "pending",
    documents: documents.length ? documents : existing?.documents || [],
    locationSnapshot: {
      location: currentUser.location || "",
      fullAddress: currentUser.fullAddress || ""
    },
    expiryTime: payload.expiryTime || existing?.expiryTime || null,
    selfDeclarationAccepted:
      payload.selfDeclarationAccepted !== undefined
        ? String(payload.selfDeclarationAccepted) === "true"
        : Boolean(existing?.selfDeclarationAccepted),
    adminNotes: existing?.adminNotes || ""
  });

  if (!existing) {
    db.verifications.unshift(verification);
  }

  writeDb(db);
  return hydrateVerification(db, verification);
};

const handleVerificationStatus = async (db, verificationId, status) => {
  const verification = db.verifications.find((item) => item._id === verificationId);

  if (!verification) {
    throw new Error("Verification item not found.");
  }

  verification.status = status;
  verification.adminNotes = status === "verified" ? "Approved in frontend demo mode." : "Rejected in frontend demo mode.";
  writeDb(db);
  return hydrateVerification(db, verification);
};

const handleProofReview = async (db, proofId, status) => {
  const proof = db.proofs.find((item) => item._id === proofId);

  if (!proof) {
    throw new Error("Proof not found.");
  }

  proof.status = status;

  const claim = db.claims.find((item) => item._id === proof.claimId);
  const provider = db.users.find((item) => item._id === claim?.providerId);
  const ngo = db.users.find((item) => item._id === claim?.ngoId);

  if (status === "approved") {
    if (provider) {
      provider.trustScore = Math.min(100, (provider.trustScore || 0) + 1);
    }
    if (ngo) {
      ngo.trustScore = Math.min(100, (ngo.trustScore || 0) + 2);
      ngo.totalContributions = (ngo.totalContributions || 0) + 1;
    }
  }

  writeDb(db);
  return hydrateProof(db, proof);
};

const handleComplaintCreate = async (db, currentUser, payload) => {
  const imageUrl = await fileToDataUrl(payload.image);
  const complaint = {
    _id: uid("complaint"),
    claimId: payload.claimId,
    providerId: payload.providerId,
    ngoId: currentUser._id,
    description: payload.description || "",
    imageUrl: imageUrl || svgDataUri("Complaint Proof", "#be123c"),
    status: "open",
    createdAt: nowIso()
  };

  db.complaints.unshift(complaint);
  writeDb(db);
  return hydrateComplaint(db, complaint);
};

const buildLeaderboard = (db, currentUser) => {
  const roleFilter =
    currentUser.role === "provider"
      ? "ngo"
      : currentUser.role === "ngo"
        ? "provider"
        : null;

  return db.users
    .filter((user) => user.role !== "admin" && (!roleFilter || user.role === roleFilter))
    .sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0))
    .map((user, index) => ({
      _id: `leader-${user._id}`,
      rank: index + 1,
      trustScore: user.trustScore || 0,
      totalContributions: user.totalContributions || 0,
      user: sanitizeUser(user)
    }));
};

const buildMapUsers = (db) =>
  db.users
    .filter((user) => user.role !== "admin")
    .map((user) => ({
      ...sanitizeUser(user),
      mapsUrl: buildMapsUrl(user)
    }));

const buildNearbyUsers = (db, currentUser, role) =>
  db.users
    .filter((user) => user.role === role)
    .map((user) => ({
      ...sanitizeUser(user),
      distanceScore: distanceKm(currentUser.latitude, currentUser.longitude, user.latitude, user.longitude) || 0,
      mapsUrl: buildMapsUrl(user)
    }))
    .sort((a, b) => a.distanceScore - b.distanceScore);

export const buildMockAssetUrl = (path = "") => path || "";

export const mockApiRequest = async (path, options = {}, token) => {
  await delay();

  const db = readDb();
  const requestUrl = new URL(path, "https://mock.local");
  const pathname = requestUrl.pathname;
  const method = (options.method || "GET").toUpperCase();
  const payload = await parseBody(options.body);
  const currentUser = getUserFromToken(db, token);

  if (pathname === "/auth/login" && method === "POST") {
    return clone(await handleAuthLogin(db, payload));
  }

  if (pathname === "/auth/register" && method === "POST") {
    return clone(await handleAuthRegister(db, payload));
  }

  if (!currentUser) {
    throw new Error("Please login to continue.");
  }

  if (pathname === "/auth/profile" && method === "PUT") {
    return clone(await handleProfileUpdate(db, currentUser, payload));
  }

  if (pathname === "/auth/map-users" && method === "GET") {
    return clone(buildMapUsers(db));
  }

  if (pathname === "/auth/nearby" && method === "GET") {
    return clone(buildNearbyUsers(db, currentUser, requestUrl.searchParams.get("role") || "ngo"));
  }

  if (pathname === "/food" && method === "GET") {
    if (requestUrl.searchParams.get("mine") === "true") {
      return clone(
        db.foodListings
          .filter((food) => food.providerId === currentUser._id)
          .map((food) => hydrateFood(db, food, currentUser))
      );
    }

    return clone(
      db.foodListings
        .filter((food) => food.status === "available" && food.providerId !== currentUser._id)
        .map((food) => hydrateFood(db, food, currentUser))
        .sort((a, b) => (a.distanceScore || 0) - (b.distanceScore || 0))
    );
  }

  if (pathname === "/food" && method === "POST") {
    return clone(await handleFoodCreate(db, currentUser, payload));
  }

  if (pathname === "/food/nearby-ngos" && method === "GET") {
    return clone(buildNearbyUsers(db, currentUser, "ngo"));
  }

  if (pathname === "/claims" && method === "GET") {
    return clone(
      db.claims
        .filter((claim) => claim.providerId === currentUser._id)
        .map((claim) => hydrateClaim(db, claim))
    );
  }

  if (pathname === "/claims" && method === "POST") {
    return clone(await handleClaimCreate(db, currentUser, payload));
  }

  if (pathname === "/claims/my-claims" && method === "GET") {
    return clone(
      db.claims
        .filter((claim) => claim.ngoId === currentUser._id)
        .map((claim) => hydrateClaim(db, claim))
    );
  }

  if (pathname === "/proof" && method === "GET") {
    return clone(
      db.proofs
        .filter((proof) => {
          const claim = db.claims.find((item) => item._id === proof.claimId);
          return claim?.providerId === currentUser._id;
        })
        .map((proof) => hydrateProof(db, proof))
    );
  }

  if (pathname === "/proof" && method === "POST") {
    return clone(await handleProofCreate(db, currentUser, payload));
  }

  if (pathname.startsWith("/proof/") && pathname.endsWith("/review") && method === "PATCH") {
    const proofId = pathname.split("/")[2];
    return clone(await handleProofReview(db, proofId, payload.status));
  }

  if (pathname === "/verification" && method === "GET") {
    return clone(db.verifications.map((item) => hydrateVerification(db, item)));
  }

  if (pathname === "/verification/mine" && method === "GET") {
    return clone(getVerificationForUser(db, currentUser._id));
  }

  if (pathname === "/verification/upload" && method === "POST") {
    return clone(await handleVerificationUpload(db, currentUser, payload));
  }

  if (pathname.startsWith("/verification/") && pathname.endsWith("/status") && method === "PATCH") {
    const verificationId = pathname.split("/")[2];
    return clone(await handleVerificationStatus(db, verificationId, payload.status));
  }

  if (pathname === "/leaderboard" && method === "GET") {
    return clone(buildLeaderboard(db, currentUser));
  }

  if (pathname === "/complaints" && method === "GET") {
    const complaints =
      currentUser.role === "admin"
        ? db.complaints
        : db.complaints.filter((complaint) => complaint.ngoId === currentUser._id);

    return clone(complaints.map((item) => hydrateComplaint(db, item)));
  }

  if (pathname === "/complaints" && method === "POST") {
    return clone(await handleComplaintCreate(db, currentUser, payload));
  }

  if (pathname.startsWith("/complaints/") && pathname.endsWith("/resolve") && method === "PATCH") {
    const complaintId = pathname.split("/")[2];
    const complaint = db.complaints.find((item) => item._id === complaintId);

    if (!complaint) {
      throw new Error("Complaint not found.");
    }

    complaint.status = "resolved";
    writeDb(db);
    return clone(hydrateComplaint(db, complaint));
  }

  if (pathname === "/admin/users" && method === "GET") {
    return clone(db.users.map((user) => sanitizeUser(user)));
  }

  if (pathname === "/admin/food" && method === "GET") {
    return clone(db.foodListings.map((food) => hydrateFood(db, food, currentUser)));
  }

  if (pathname === "/admin/overview" && method === "GET") {
    return clone({
      pendingVerifications: db.verifications.filter((item) => item.status === "pending").length,
      openComplaints: db.complaints.filter((item) => item.status === "open").length,
      topTrust: buildLeaderboard(db, { role: "admin" }).slice(0, 5)
    });
  }

  throw new Error(`Mock route not implemented: ${method} ${pathname}`);
};
