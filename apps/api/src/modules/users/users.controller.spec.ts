import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { mockUser, mockAdmin } from '../../../test/fixtures/users.fixture';
import { encodeCursor } from '@/common/utils/cursor.util';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockUserService = {
      getFindById: jest.fn(),
      getAll: jest.fn(),
      getAllCursor: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── findAll (offset) ────────────────────────────────────────────────────────

  describe('findAll', () => {
    const queryPagination = {
      page: 1,
      limit: 10,
    };
    it('should return all users with default pagination', async () => {
      const paginatedResponse = {
        items: [mockUser],
        page: 1,
        limit: 10,
        total: 1,
      };
      usersService.getAll.mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(queryPagination);

      expect(usersService.getAll).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(paginatedResponse);
      expect(result.items).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should return users with custom pagination', async () => {
      const paginatedResponse = {
        items: [mockUser],
        page: 2,
        limit: 5,
        total: 1,
      };
      usersService.getAll.mockResolvedValue(paginatedResponse);
      const queryForPagination = {
        page: 2,
        limit: 5,
      };
      const result = await controller.findAll(queryForPagination);

      expect(usersService.getAll).toHaveBeenCalledWith(2, 5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });

    it('should handle empty results', async () => {
      const emptyResponse = {
        items: [],
        page: 1,
        limit: 10,
        total: 0,
      };
      usersService.getAll.mockResolvedValue(emptyResponse);

      const result = await controller.findAll(queryPagination);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ─── findAllCursor ───────────────────────────────────────────────────────────

  describe('findAllCursor', () => {
    it('should return cursor-paginated response on first page', async () => {
      const cursorResponse = {
        items: [mockUser],
        limit: 20,
        nextCursor: encodeCursor(mockUser.id),
        prevCursor: null,
      };
      usersService.getAllCursor.mockResolvedValue(cursorResponse);

      const result = await controller.findAllCursor({
        cursor: undefined,
        prevCursor: undefined,
        limit: 20,
      });

      expect(usersService.getAllCursor).toHaveBeenCalledWith(
        undefined,
        undefined,
        20,
      );
      expect(result).toEqual(cursorResponse);
      expect(result.nextCursor).toBe(encodeCursor(mockUser.id));
      expect(result.prevCursor).toBeNull();
    });

    it('should forward cursor to service for forward navigation', async () => {
      const cursorValue = encodeCursor(mockUser.id);
      const cursorResponse = {
        items: [mockAdmin],
        limit: 10,
        nextCursor: encodeCursor(mockAdmin.id),
        prevCursor: cursorValue,
      };
      usersService.getAllCursor.mockResolvedValue(cursorResponse);

      const result = await controller.findAllCursor({
        cursor: cursorValue,
        prevCursor: undefined,
        limit: 10,
      });

      expect(usersService.getAllCursor).toHaveBeenCalledWith(
        cursorValue,
        undefined,
        10,
      );
      expect(result.items).toHaveLength(1);
      expect(result.prevCursor).toBe(cursorValue);
    });

    it('should forward prevCursor to service for backward navigation', async () => {
      const prevCursorValue = encodeCursor(mockAdmin.id);
      const cursorResponse = {
        items: [mockUser],
        limit: 10,
        nextCursor: prevCursorValue,
        prevCursor: null,
      };
      usersService.getAllCursor.mockResolvedValue(cursorResponse);

      const result = await controller.findAllCursor({
        cursor: undefined,
        prevCursor: prevCursorValue,
        limit: 10,
      });

      expect(usersService.getAllCursor).toHaveBeenCalledWith(
        undefined,
        prevCursorValue,
        10,
      );
      expect(result).toEqual(cursorResponse);
    });

    it('should return empty list with both cursors null', async () => {
      const emptyResponse = {
        items: [],
        limit: 20,
        nextCursor: null,
        prevCursor: null,
      };
      usersService.getAllCursor.mockResolvedValue(emptyResponse);

      const result = await controller.findAllCursor({
        cursor: undefined,
        prevCursor: undefined,
        limit: 20,
      });

      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
      expect(result.prevCursor).toBeNull();
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return user by id without password', async () => {
      usersService.getFindById.mockResolvedValue(mockAdmin);

      const result = await controller.findOne(mockAdmin.id);

      expect(usersService.getFindById).toHaveBeenCalledWith(mockAdmin.id);
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id', mockAdmin.id);
    });

    it('should throw NotFoundException when user not found', async () => {
      usersService.getFindById.mockResolvedValue(null);

      await expect(controller.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne('nonexistent-id')).rejects.toThrow(
        'Not found user',
      );
    });
  });
});
