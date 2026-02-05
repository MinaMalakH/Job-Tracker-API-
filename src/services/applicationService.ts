import { Application, IApplication } from "../models/Application";
import { BadRequestError } from "../middleware/errorHandler";
import { Types } from "mongoose";

interface CreateApplicationInput {
  company: string;
  position: string;
  jobDescription?: string;
  jobUrl?: string;
  platform?: string;
  location?: string;
  salaryRange?: { min?: number; max?: number; currency?: string };
  status?: string;
  appliedDate?: Date;
  notes?: string;
}

export class ApplicationService {
  static async createApplication(
    userId: string,
    data: CreateApplicationInput,
  ): Promise<IApplication> {
    const application = await Application.create({
      userId,
      ...data,
      timeline: data.status
        ? [{ status: data.status || "applied", date: new Date() }]
        : [{ status: "applied", date: new Date() }],
    });

    return application;
  }

  static async getUserApplications(
    userId: string,
    filters: {
      status?: string;
      platform?: string;
      company?: string;
      sortBy?: string; // "appliedDate" | "lastUpdated";
    },
  ): Promise<IApplication[]> {
    const query: any = { userId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.platform) {
      query.platform = filters.platform;
    }

    if (filters.company) {
      query.company = filters.company;
    }

    let sort: Record<string, 1 | -1> = { appliedDate: -1 }; // default newest first
    if (filters.sortBy) {
      const [field, order] = filters.sortBy.startsWith("-")
        ? [filters.sortBy.slice(1), -1]
        : [filters.sortBy, 1];
      sort = { [field]: order as 1 | -1 };
    }

    return Application.find(query).sort(sort).lean();
  }

  static async getApplicationById(
    userId: string,
    applicationId: string,
  ): Promise<IApplication | null> {
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestError("Invalid Application ID");
    }
    const application = await Application.findOne({
      _id: applicationId,
      userId,
    }).lean();

    if (!application) {
      throw new BadRequestError("Application not found or not owned by user");
    }
    return application;
  }

  static async updateApplication(
    userId: string,
    applicationId: string,
    data: Partial<CreateApplicationInput>,
  ): Promise<IApplication | null> {
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestError("Invalid Application ID");
    }
    const application = await Application.findOneAndUpdate(
      { _id: applicationId, userId },
      { ...data },
      { new: true },
    ).lean();

    if (!application) {
      throw new BadRequestError("Application not found or not owned by user");
    }
    return application;
  }

  static async deleteApplication(
    userId: string,
    applicationId: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestError("Invalid application ID");
    }

    const result = await Application.deleteOne({ _id: applicationId, userId });

    if (result.deletedCount === 0) {
      throw new BadRequestError("Application not found or not owned by user");
    }
  }

  static async updateStatus(
    userId: string,
    applicationId: string,
    status: string,
  ): Promise<IApplication> {
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestError("Invalid application ID");
    }

    if (
      !["applied", "screening", "interview", "offer", "rejected"].includes(
        status,
      )
    ) {
      throw new BadRequestError("Invalid status value");
    }
    const application = await Application.findOneAndUpdate(
      {
        _id: applicationId,
        userId,
      },
      {
        $set: {
          status,
          lastUpdated: new Date(),
        },
        $push: {
          timeline: {
            status,
            date: new Date(),
            notes: `Status changed to ${status}`,
          },
        },
      },
      { new: true, runValidators: true },
    ).lean();

    if (!application) {
      throw new BadRequestError("Application not found or not owned by user");
    }

    return application;
  }
}
