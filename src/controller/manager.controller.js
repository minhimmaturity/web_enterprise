const { PrismaClient } = require('@prisma/client');
const { StatusCodes } = require('http-status-codes');
const prisma = new PrismaClient();

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

module.exports = { getContributionsStatsByFacultyAndYear, getContributionPercentageByFaculty };
