// User controller — profile retrieval and updates for the authenticated user
const prisma = require("../../config/prisma");

// Fields that are safe to return in API responses (excludes password, refreshToken)
const userResponseFields = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  areaofexpertise: true,
  role: true,
  avatar: true,
  isApproved: true,
  createdAt: true,
  updatedAt: true,
};

// Returns the profile of the currently authenticated user
exports.getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: userResponseFields,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

// Updates the profile of the currently authenticated user
// Only allows updating firstName, lastName, phone, and avatar
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;

    // Build the update payload with only provided fields
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    // If phone is being changed, check it is not already taken
    if (updateData.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: updateData.phone },
      });
      if (existingPhone && existingPhone.id !== req.user.id) {
        return res.status(409).json({ message: "Phone number already in use" });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: userResponseFields,
    });

    return res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    next(error);
  }
};
