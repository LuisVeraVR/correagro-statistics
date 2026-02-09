import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module';
import { users } from '../drizzle/schema';
import { eq, or, and, gt } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../drizzle/schema';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

export type User = typeof users.$inferSelect;

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<typeof schema>) {}

  async findOne(usernameOrEmail: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(
      or(
        eq(users.email, usernameOrEmail),
        eq(users.name, usernameOrEmail)
      )
    );
    return result[0];
  }

  async findById(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async findAll(): Promise<User[]> {
    return this.db.select().from(users);
  }

  async create(createUserDto: CreateUserDto): Promise<void> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    await this.db.insert(users).values({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const updateData: any = { ...updateUserDto };
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.db.update(users).set(updateData).where(eq(users.id, id));
  }

  async remove(id: number): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async generateResetToken(email: string): Promise<{ token: string; userName: string } | null> {
    const user = await this.findOne(email);
    if (!user) return null;

    const token = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-char code
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.db.update(users).set({
      resetToken: token,
      resetTokenExpiry: expiry,
    }).where(eq(users.id, user.id));

    return { token, userName: user.name };
  }

  async validateResetToken(email: string, token: string): Promise<boolean> {
    const result = await this.db.select().from(users).where(
      and(
        or(eq(users.email, email), eq(users.name, email)),
        eq(users.resetToken, token),
        gt(users.resetTokenExpiry, new Date())
      )
    );
    return result.length > 0;
  }

  async resetPassword(email: string, token: string, newPassword: string): Promise<boolean> {
    const isValid = await this.validateResetToken(email, token);
    if (!isValid) return false;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await this.findOne(email);
    if (!user) return false;

    await this.db.update(users).set({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    }).where(eq(users.id, user.id));

    return true;
  }
}
