const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { sendMailResetPassword } = require("../utils/mail-service");
const redisClient = require("../utils/connectRedis");
const hashPassword = require("../utils/hashPassword");
const prisma = new PrismaClient();
const { StatusCodes } = require("http-status-codes");
const { storage, fetchFileFromFirebase } = require("../utils/firebase");
const bucket = storage;
const { sendMailToCoordinator } = require("../utils/mail-service");
const changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const validPassword = await bcrypt.compare(oldPassword, user.password);

    if (!validPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Invalid old password",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: {
        email,
      },
      data: {
        password: hashedPassword,
      },
    });

    res.status(StatusCodes.OK).json({
      message: "Password updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const editUserProfile = async (req, res) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
      include: {
        images: true, // Assuming you have a relation named 'images' in your User model
      },
    });

    if (!existingUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const files = req.files["files"];
    const { name } = req.body;
    let avatar = existingUser.avatar;

    // Delete old images from Firebase Storage and database
    const imagesToDelete = existingUser.images.filter(
      (img) => !files.some((file) => file.originalname === img.name)
    );

    const deletionPromises = imagesToDelete.map(async (img) => {
      await prisma.image.delete({
        where: { id: img.id },
      });

      const filePath = `images/${existingUser.id}/${img.name}`;
      const blob = bucket.file(filePath);
      await blob.delete();
    });

    await Promise.all(deletionPromises);

    // Upload new images and update avatar if necessary
    if (files && files.length > 0) {
      const imageUploadPromises = files
        .filter((file) => file.mimetype.includes("image"))
        .map(async (file) => {
          const filePath = `avatar/${existingUser.id}/${file.originalname}`;
          const blob = bucket.file(filePath);

          // Upload file to Firebase Storage
          await blob.save(file.buffer, {
            metadata: {
              contentType: file.mimetype,
            },
          });

          // Get download URL for the image
          const [imageUrl] = await blob.getSignedUrl({
            action: "read",
            expires: "03-17-2025",
          });

          return imageUrl;
        });

      // Wait for all image upload promises to resolve
      const imageUrls = await Promise.all(imageUploadPromises);

      // If there are uploaded images, update the user's avatar
      if (imageUrls.length > 0) {
        avatar = imageUrls[0]; // Assuming only one image is uploaded
      }
    }

    // Update user profile in the database
    const updatedUser = await prisma.user.update({
      where: {
        email: req.decodedPayload.data.email,
      },
      data: {
        name,
        avatar,
        updatedAt: new Date(Date.now()).toISOString(),
      },
    });

    res.status(StatusCodes.OK).json({
      message: "User profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const sentOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    await sendMailResetPassword(email);

    res.status(StatusCodes.OK).json({
      message: "Password reset link sent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const resetPassword = async (req, res) => {
  const { otp, email, newPassword, reNewPassword } = req.body;
  const key = "otp" + " " + email;
  const otpInRedis = await redisClient.get(key);

  if (!otpInRedis) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Invalid otp",
    });
  }

  if (otp !== otpInRedis) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Invalid otp",
    });
  }

  if (newPassword !== reNewPassword) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Passwords do not match",
    });
  }

  const password = await hashPassword(newPassword);

  const updatedUser = await prisma.user.update({
    where: { email: email },
    data: { password: password },
  });

  res.status(StatusCodes.OK).json({
    message: "Password updated successfully",
    user: updatedUser,
  });
};

const uploadContribution = async (req, res) => {
  try {
    const currentTimestamp = new Date();

    // Batch database queries
    const [academicYear, user, files] = await Promise.all([
      prisma.academicYear.findFirst({
        where: {
          closure_date: { gte: currentTimestamp },
        },
      }),
      prisma.user.findUnique({
        where: { email: req.decodedPayload.data.email },
      }),
      req.files["files"],
    ]);

    if (!academicYear) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "No academic year found",
      });
    }

    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "No user found",
      });
    }

    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Title and description are required",
      });
    }

    if (!files) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          "At least one document or image is required for the contribution",
      });
    }

    // Save contribution
    const newContribution = await prisma.contribution.create({
      data: {
        title: title,
        description: description,
        userId: user.id,
        AcademicYearId: academicYear.id,
      },
    });

    // Parallelize file processing
    const processingPromises = [
      processDocuments(newContribution.id, files, []),
      processImages(newContribution.id, files, []),
    ];
    await Promise.all(processingPromises);

    // Send notification to users in parallel
    const usersToNotify = await prisma.user.findMany({
      where: {
        FacultyId: user.FacultyId,
        role: Role.COORDIONATOR || Role.MANAGER,
      },
    });

    const notificationContent = `A new contribution titled "${title}" has been added.`;

    const notificationPromises = usersToNotify.map((user) =>
      sendNotification(newContribution.id, user.id, notificationContent)
    );
    await Promise.all(notificationPromises);

    res
      .status(StatusCodes.OK)
      .json({ message: "Contribution uploaded successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};
const processImages = async (contributionId, files, existingImages) => {
  const imageUploadPromises = [];

  for (const file of files) {
    if (
      file.mimetype.includes("image") ||
      file.mimetype === "application/octet-stream"
    ) {
      const existingImage = existingImages.find(
        (img) => img.name === file.originalname
      );

      const filePath = `images/${contributionId}/${file.originalname}`;
      const blob = bucket.file(filePath);

      await blob.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      const [imageUrl] = await blob.getSignedUrl({
        action: "read",
        expires: "03-17-2025",
      });

      if (existingImage) {
        await prisma.image.update({
          where: { id: existingImage.id },
          data: {
            path: imageUrl,
            updatedAt: new Date(Date.now()).toISOString(),
          },
        });
      } else {
        await prisma.image.create({
          data: {
            name: file.originalname,
            path: imageUrl,
            contributionId: contributionId,
          },
        });
      }

      imageUploadPromises.push(imageUrl);
    }
  }

  return imageUploadPromises;
};

const processDocuments = async (contributionId, files, existingDocuments) => {
  const documentUploadPromises = [];

  for (const file of files) {
    if (
      file.mimetype.includes("application") &&
      file.mimetype !== "application/octet-stream"
    ) {
      const existingDocument = existingDocuments.find(
        (doc) => doc.name === file.originalname
      );

      const filePath = `documents/${contributionId}/${file.originalname}`;
      const blob = bucket.file(filePath);

      await blob.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      const [documentUrl] = await blob.getSignedUrl({
        action: "read",
        expires: "03-17-2025",
      });

      if (existingDocument) {
        await prisma.documents.update({
          where: { id: existingDocument.id },
          data: {
            path: documentUrl,
            updatedAt: new Date(Date.now()).toISOString(),
          },
        });
      } else {
        await prisma.documents.create({
          data: {
            name: file.originalname,
            path: documentUrl,
            contributionId: contributionId,
          },
        });
      }

      documentUploadPromises.push(documentUrl);
    }
  }

  return documentUploadPromises;
};

const deleteUnusedDocuments = async (
  contributionId,
  existingDocuments,
  files
) => {
  const documentsToDelete = existingDocuments.filter(
    (doc) => !files.some((file) => file.originalname === doc.name)
  );

  for (const doc of documentsToDelete) {
    await prisma.documents.delete({ where: { id: doc.id } });

    const filePath = `documents/${contributionId}/${doc.name}`;
    const blob = bucket.file(filePath);
    await blob.delete();
  }
};

const deleteUnusedImages = async (contributionId, existingImages, files) => {
  const imagesToDelete = existingImages.filter(
    (img) => !files.some((file) => file.originalname === img.name)
  );

  for (const img of imagesToDelete) {
    await prisma.image.delete({ where: { id: img.id } });

    const filePath = `images/${contributionId}/${img.name}`;
    const blob = bucket.file(filePath);
    await blob.delete();
  }
};

const sendNotification = async (contributionId, userId, content) => {
  try {
    // Save the notification to the database
    const newNotification = await prisma.notification.create({
      data: {
        content: content,
        contributionId: contributionId,
        userId: userId,
      },
    });

    // Fetch user's faculty ID
    const userFaculty = await prisma.user.findUnique({
      where: { id: userId },
      select: { FacultyId: true },
    });

    // Fetch coordinators of the user's faculty
    const coordinators = await prisma.user.findMany({
      where: {
        FacultyId: userFaculty.FacultyId,
        role: "COORDIONATOR",
      },
      select: { email: true },
    });

    // Send email notifications to coordinators
    const notificationContent = `A new contribution has been added: "${content}"`;
    coordinators.forEach(async (coordinator) => {
      await sendMailToCoordinator(coordinator.email, notificationContent);
    });

    console.log(`Notification sent: ${content}`);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
const editMyContributions = async (req, res) => {
  try {
    const { contributionId } = req.params;
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Title and description are required",
      });
    }

    const user = await prisma.user.findFirst({
      where: { email: req.decodedPayload.data.email },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const contribution = await prisma.contribution.findFirst({
      where: { userId: user.id, id: contributionId },
    });

    if (!contribution) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Contribution not found",
      });
    }

    // Fetch existing documents and images
    const existingDocuments = await prisma.documents.findMany({
      where: { contributionId: contributionId },
    });

    const existingImages = await prisma.image.findMany({
      where: { contributionId: contributionId },
    });

    const files = req.files["files"];

    console.log(files);

    const documentUploadPromises = await processDocuments(
      contributionId,
      files,
      existingDocuments
    );
    const imageUploadPromises = await processImages(
      contributionId,
      files,
      existingImages
    );

    await deleteUnusedDocuments(contributionId, existingDocuments, files);
    await deleteUnusedImages(contributionId, existingImages, files);

    // Update contribution title and description
    const updateContribution = await prisma.contribution.update({
      where: { id: contributionId },
      data: { title, description },
    });

    res.status(StatusCodes.OK).json({
      message: "Contribution updated successfully",
      contribution: updateContribution,
      documents: documentUploadPromises,
      images: imageUploadPromises,
    });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

const getPublishContributions = async (req, res) => {
  try {
    const limit = 10;
    let offset = 0;
    let allChosenContributions = [];
    const { sort } = req.query;

    const queryOptions = {
      where: {
        is_choosen: true,
        is_public: true, // Filter by is_public field
      },
      include: {
        user: {
          select: {
            name: true,
            Faculty: { select: { name: true } },
          },
        },
        AcademicYear: true,
        Documents: true,
        Image: true,
      },
      take: limit,
      orderBy: { createdAt: sort === "asc" ? "asc" : "desc" }, // Move orderBy inside include
    };

    while (true) {
      const contributions = await prisma.contribution.findMany({
        ...queryOptions,
        skip: offset,
      });

      if (contributions.length === 0) {
        break;
      }

      allChosenContributions.push(contributions);
      offset += limit;
    }

    res.status(StatusCodes.OK).json({ allChosenContributions });
  } catch (error) {
    console.error("Error fetching chosen contributions:", error.message);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to fetch chosen contributions." });
  }
};

const viewMyContributions = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }
    const { sort } = req.query;
    const limit = 10;
    let offset = 0;
    let allMyContributions = [];
    const queryOptions = {
      where: {
        userId: user.id,
      },
      include: {
        AcademicYear: {
          select: {
            closure_date: true,
            final_closure_date: true,
          },
        },
        Image: {
          select: {
            path: true,
          },
        },
      },
      take: limit,
      skip: offset,
    };

    if (sort) {
      queryOptions.orderBy = {
        createdAt: sort === "asc" ? "asc" : "desc",
      };
    }

    while (true) {
      const contributions = await prisma.contribution.findMany(queryOptions);

      if (contributions.length === 0) {
        break;
      }

      allMyContributions.push(contributions);
      offset += limit;
      queryOptions.skip = offset;
    }

    res.status(StatusCodes.OK).json({
      allMyContributions: allMyContributions,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const viewContributionDetail = async (req, res) => {
  const { Id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const contributions = await prisma.contribution.findFirst({
      where: { id: Id },
    });

    const academicYear = await prisma.academicYear.findFirst({
      where: { id: contributions.AcademicYearId },
    });

    const document = await prisma.documents.findMany({
      where: { contributionId: contributions.id },
    });

    const image = await prisma.image.findMany({
      where: { contributionId: contributions.id },
    });

    const comment = await prisma.comment.findMany({
      where: { contributionId: contributions.id },
    });

    res.status(StatusCodes.OK).json({
      message: "View details successfully",
      contribution: contributions,
      academicYear: {
        closure_date: academicYear.closure_date,
        final_closure_date: academicYear.final_closure_date,
      },
      document: document.map((document) => {
        return {
          name: document.name,
          path: document.path,
        };
      }),
      image: image.map((image) => {
        return {
          name: image.name,
          path: image.path,
        };
      }),
      comment: comment.map((comment) => {
        return {
          content: comment.content,
        };
      }),
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const viewMyProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const userProfile = await prisma.user.findFirst({
      where: {
        id: user.id,
      },
    });

    res.status(StatusCodes.OK).json({
      userProfile,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const deleteContribution = async (req, res) => {
  const { Id } = req.params;

  if (!Id) {
    res.status(StatusCodes.NOT_FOUND).json({
      message: "id is missing",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const contribution = await prisma.contribution.findFirst({
      where: { id: Id },
    });

    if (!contribution) {
      res.status(StatusCodes.NOT_FOUND).json({
        message: "Your contribution not found",
      });
    } else {
      await prisma.contribution.delete({
        where: { id: Id },
      });
    }

    res.status(StatusCodes.OK).json({
      message: "Your contribution deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const viewCoordinatorByFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const coordinator = await prisma.user.findMany({
      where: { FacultyId: facultyId, role: Role.COORDIONATOR },
    });

    res.status(StatusCodes.OK).json({
      coordinator: coordinator,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const countNotifications = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
    });

    res.status(StatusCodes.OK).json({
      count: notifications.length,
    });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  editUserProfile,
  changePassword,
  sentOtp,
  resetPassword,
  uploadContribution,
  viewMyContributions,
  viewContributionDetail,
  viewMyProfile,
  deleteContribution,
  editMyContributions,
  getPublishContributions,
  viewCoordinatorByFaculty,
  countNotifications
};
