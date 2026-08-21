// Resource controller — CRUD operations for the resource library
// Resources are shareable items (articles, videos, PDFs) that therapists and
// admins can curate for parents. All authenticated users can view resources;
// only ADMIN and THERAPIST roles may create/update, and only ADMIN may delete.
const prisma = require("../../config/prisma");

// GET /api/v1/resources
// Returns a paginated list of resources, optionally filtered by type
// (ARTICLE / VIDEO / PDF) and/or a search term matched against the title.
// Results are sorted newest-first and include the uploader's name.
exports.listResources = async (req, res, next) => {
  try {
    const { type, search } = req.query;
    const where = {};
    if (type) where.type = type;
    if (search) where.title = { contains: search, mode: "insensitive" };

    const resources = await prisma.resource.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
    });

    return res.status(200).json({ resources });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/resources/:id
// Returns a single resource by its ID, including uploader details.
// Throws 404 if the resource does not exist.
exports.getResource = async (req, res, next) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: req.params.id },
      include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    return res.status(200).json({ resource });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/resources
// Creates a new resource. Only ADMIN and THERAPIST roles are permitted
// (enforced at the route level). The requesting user is recorded as the uploader.
exports.createResource = async (req, res, next) => {
  try {
    const { title, description, type, url, thumbnailUrl } = req.body;
    const resource = await prisma.resource.create({
      data: { title, description, type, url, thumbnailUrl: thumbnailUrl || null, uploadedById: req.user.id },
      include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
    });
    return res.status(201).json({ message: "Resource created", resource });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/resources/:id
// Updates an existing resource's fields. Only ADMIN and THERAPIST roles may
// perform updates. Returns 404 if the resource is not found.
exports.updateResource = async (req, res, next) => {
  try {
    const { title, description, type, url, thumbnailUrl } = req.body;
    const existing = await prisma.resource.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Resource not found" });

    const resource = await prisma.resource.update({
      where: { id: req.params.id },
      data: { title, description, type, url, thumbnailUrl },
      include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
    });
    return res.status(200).json({ message: "Resource updated", resource });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/resources/:id
// Permanently removes a resource. Only ADMIN role may delete resources.
// Returns 404 if the resource does not exist.
exports.deleteResource = async (req, res, next) => {
  try {
    const existing = await prisma.resource.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Resource not found" });
    await prisma.resource.delete({ where: { id: req.params.id } });
    return res.status(200).json({ message: "Resource deleted" });
  } catch (error) {
    next(error);
  }
};
