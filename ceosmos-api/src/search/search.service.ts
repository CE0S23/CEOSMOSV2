import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchAll(query: string) {
    if (!query || query.trim() === '') {
      return { users: [], tasks: [], media: [] };
    }

    const term = query.trim();

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      },
      select: { id: true, username: true, email: true, role: true },
      take: 10,
    });

    const tasks = await this.prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    const media = await this.prisma.mediaItem.findMany({
      where: {
        title: { contains: term, mode: 'insensitive' },
      },
      take: 10,
    });

    return {
      users,
      tasks,
      media,
    };
  }
}
