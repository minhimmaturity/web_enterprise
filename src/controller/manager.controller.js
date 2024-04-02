const { PrismaClient } = require('@prisma/client');
const { StatusCodes } = require('http-status-codes');
const prisma = new PrismaClient();
const { sendMailToCoordinator2, sendMailToStudent } = require("../utils/mail-service")

const getContributionsStatsByFacultyAndYear = async (req, res) => {
    try {
        const contributions = await prisma.contribution.findMany({
            select: {
                id: true,
                AcademicYear: true,
                user: {
                    select: {
                        Faculty: true,
                    },
                },
            },
        });

        const contributionsStats = {};
        contributions.forEach(contribution => {
            const faculty = contribution.user?.Faculty;
            if (faculty && faculty.name) {
                const facultyName = faculty.name;
                const academicYearId = contribution.AcademicYear.id;
                if (!contributionsStats[facultyName]) {
                    contributionsStats[facultyName] = {};
                }
                if (!contributionsStats[facultyName][academicYearId]) {
                    contributionsStats[facultyName][academicYearId] = 1;
                } else {
                    contributionsStats[facultyName][academicYearId]++;
                }
            }
        });

        res.json(contributionsStats);
    } catch (error) {
        console.error('Error fetching contributions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getContributionPercentageByFaculty = async (req, res) => {
    try {
        const contributions = await prisma.contribution.findMany({
            select: {
                id: true,
                user: {
                    select: {
                        Faculty: true,
                    },
                },
            },
        });
        const facultyContributionsCount = {};
        const totalContributions = contributions.length;

        contributions.forEach(contribution => {
            const faculty = contribution.user?.Faculty;
            if (faculty && faculty.name) {
                const facultyName = faculty.name;
                if (!facultyContributionsCount[facultyName]) {
                    facultyContributionsCount[facultyName] = 1;
                } else {
                    facultyContributionsCount[facultyName]++;
                }
            }
        });

        const contributionPercentageByFaculty = {};
        Object.keys(facultyContributionsCount).forEach(facultyName => {
            const contributionCount = facultyContributionsCount[facultyName];
            const percentage = (contributionCount / totalContributions) * 100;
            contributionPercentageByFaculty[facultyName] = percentage.toFixed(2);
        });

        return res.status(StatusCodes.OK).json(contributionPercentageByFaculty);
    } catch (error) {
        console.error('Error fetching contribution percentage by faculty:', error);
        res.status(500).json({ error: 'Failed to fetch contribution percentage by faculty' });
    }
};


const publishContribution = async (req, res) => {
    const { Id } = req.params;

    try {
        // Fetch the contribution
        const contribution = await prisma.contribution.findUnique({
            where: { id: Id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        FacultyId: true,
                    },
                },
            },
        });

        // Check if the contribution exists
        if (!contribution) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Contribution not found.' });
        }

        // Check if is_choosen is false
        if (contribution.is_choosen === false) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Cannot publish contribution because it is not chosen.' });
        }

        // Update the contribution
        const updatedContribution = await prisma.contribution.update({
            where: { id: Id },
            data: { is_public: true },
        });

        // Get the user's email associated with the contribution
        const userEmail = contribution.user.email;
        const userName = contribution.user.name;

        // Create a notification for the student
        const studentNotificationContent = `Your contribution titled "${updatedContribution.title}" has been published.`;
        const studentNotification = await prisma.notification.create({
            data: {
                content: studentNotificationContent,
                contributionId: updatedContribution.id,
                userId: contribution.user.id,
            },
        });

        // Send notification email to the user
        await sendMailToStudent(userName, userEmail, studentNotificationContent);

        // Send notification email to coordinators
        const coordinatorNotificationContent = `A contribution titled "${updatedContribution.title}" by ${contribution.user.name} has been published.`;
        const coordinators = await prisma.user.findMany({
            where: {
                FacultyId: contribution.user.FacultyId,
                role: "COORDIONATOR",
            },
            select: { id: true, email: true },
        });

        // Create notifications for coordinators
        const coordinatorNotifications = coordinators.map(coordinator => {
            return prisma.notification.create({
                data: {
                    content: coordinatorNotificationContent,
                    contributionId: updatedContribution.id,
                    userId: coordinator.id,
                },
            });
        });

        // Await creation of all coordinator notifications
        await Promise.all(coordinatorNotifications);
        coordinators.forEach(coordinator => {
            console.log(coordinator.email);
        });
        // Send email to each coordinator
        coordinators.forEach(async coordinator => {
            await sendMailToCoordinator2(coordinator.email, coordinatorNotificationContent);
        });

        // Send response
        res.status(StatusCodes.OK).json({ message: 'Contribution has been published.', contribution: updatedContribution });
    } catch (error) {
        console.error('Error publishing contribution:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to publish contribution.' });
    }
};





const getChosenContributions = async (req, res) => {
    try {
        const chosenContributions = await prisma.contribution.findMany({
            where: {
                is_choosen: true
            },
            include: {
                user: true,
                AcademicYear: true
            }
        });

        res.status(StatusCodes.OK).json(chosenContributions);
    } catch (error) {
        console.error('Error fetching chosen contributions:', error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch chosen contributions.' });
    }
};

module.exports = {
    getContributionsStatsByFacultyAndYear,
    getContributionPercentageByFaculty,
    publishContribution,
    getChosenContributions
};

