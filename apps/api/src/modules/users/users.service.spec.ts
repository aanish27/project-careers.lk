import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import {
  IUsersRepository,
  USER_REPOSITORY,
} from './repositories/users.repository.interface';
import {
  mockUser,
  mockUsers,
  createMockUser,
} from '../../../test/fixtures/users.fixture';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/users.response.dto';
import { encodeCursor, decodeCursor } from '@/common/utils/cursor.util';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<IUsersRepository>;

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      findActive: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(USER_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.getUserByEmail('test@example.com');

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await service.getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('should return user when found', async () => {
      userRepository.findByUsername.mockResolvedValue(mockUser);

      const result = await service.getUserByUsername('testuser');

      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      userRepository.findByUsername.mockResolvedValue(null);

      const result = await service.getUserByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getFindById', () => {
    it('should return user when found', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getFindById('user-123');

      expect(userRepository.findById).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      const result = await service.getFindById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    const userData = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'hashedpassword',
      firstName: 'New',
      lastName: 'User',
    };

    it('should create user when email does not exist', async () => {
      const newUser = createMockUser({ ...userData, id: 'new-id' });
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(newUser);

      const result = await service.createUser(userData);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(userRepository.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(newUser);
    });

    it('should throw error when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.createUser(userData)).rejects.toThrow(
        'User already exists',
      );
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should skip email check when email is not provided', async () => {
      const userDataWithoutEmail = {
        username: 'newuser',
        password: 'hashedpassword',
        firstName: 'New',
        lastName: 'User',
      } as any;
      const newUser = createMockUser({ id: 'new-id' });
      userRepository.create.mockResolvedValue(newUser);

      await service.createUser(userDataWithoutEmail);

      expect(userRepository.findByEmail).not.toHaveBeenCalled();
      expect(userRepository.create).toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('should return paginated users with default pagination', async () => {
      const totalCount = 25;
      userRepository.findAll.mockResolvedValue(mockUsers);
      userRepository.count.mockResolvedValue(totalCount);

      const result = await service.getAll(1, 10);

      expect(userRepository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
      expect(userRepository.count).toHaveBeenCalled();
      expect(result).toEqual({
        items: plainToInstance(UserResponseDto, mockUsers, {
          excludeExtraneousValues: true,
        }),
        page: 1,
        limit: 10,
        total: totalCount,
      });
    });

    it('should calculate skip correctly for different pages', async () => {
      const totalCount = 25;
      userRepository.findAll.mockResolvedValue([]);
      userRepository.count.mockResolvedValue(totalCount);

      const result = await service.getAll(3, 5);

      expect(userRepository.findAll).toHaveBeenCalledWith({
        skip: 10,
        take: 5,
      });
      expect(result).toEqual({
        items: [],
        page: 3,
        limit: 5,
        total: totalCount,
      });
    });

    it('should handle page 2 with limit 10', async () => {
      const totalCount = 50;
      userRepository.findAll.mockResolvedValue(mockUsers);
      userRepository.count.mockResolvedValue(totalCount);

      const result = await service.getAll(2, 10);

      expect(userRepository.findAll).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
      });
      expect(result).toEqual({
        items: plainToInstance(UserResponseDto, mockUsers, {
          excludeExtraneousValues: true,
        }),
        page: 2,
        limit: 10,
        total: totalCount,
      });
    });
  });

  // ─── Cursor helpers ─────────────────────────────────────────────────────────

  describe('encodeCursor / decodeCursor', () => {
    it('should round-trip an id correctly', () => {
      const id = 'user-abc-123';
      expect(decodeCursor(encodeCursor(id))).toBe(id);
    });

    it('encoded cursor should be a valid base64 string', () => {
      const cursor = encodeCursor('some-id');
      expect(() => Buffer.from(cursor, 'base64')).not.toThrow();
    });
  });

  // ─── getAllCursor ────────────────────────────────────────────────────────────

  describe('getAllCursor', () => {
    const limit = 2;

    it('should return first page with nextCursor when more items exist', async () => {
      // Repo returns limit+1 items → there is a next page
      const extraItems = [mockUser, mockUsers[1], mockUsers[2]]; // 3 items for limit=2
      userRepository.findAll.mockResolvedValue(extraItems);

      const result = await service.getAllCursor(undefined, undefined, limit);

      // Called with take = limit+1, ordered asc, no cursor filter
      expect(userRepository.findAll).toHaveBeenCalledWith({
        take: limit + 1,
        orderBy: { id: 'asc' },
      });

      // items trimmed to limit
      expect(result.items).toHaveLength(limit);
      expect(result.limit).toBe(limit);
      expect(result.nextCursor).not.toBeNull();
      expect(result.prevCursor).toBeNull(); // first page has no prev
    });

    it('should return last page with nextCursor null when no more items', async () => {
      // Repo returns exactly limit items → no next page
      userRepository.findAll.mockResolvedValue([mockUser, mockUsers[1]]);

      const result = await service.getAllCursor(undefined, undefined, limit);

      expect(result.items).toHaveLength(limit);
      expect(result.nextCursor).toBeNull();
      expect(result.prevCursor).toBeNull();
    });

    it('should return empty result with both cursors null', async () => {
      userRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllCursor(undefined, undefined, limit);

      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
      expect(result.prevCursor).toBeNull();
    });

    it('should use WHERE id > afterId when cursor is provided (forward)', async () => {
      const cursorId = mockUser.id;
      const cursor = encodeCursor(cursorId);
      userRepository.findAll.mockResolvedValue([mockUsers[1]]);

      const result = await service.getAllCursor(cursor, undefined, limit);

      expect(userRepository.findAll).toHaveBeenCalledWith({
        where: { id: { gt: cursorId } },
        take: limit + 1,
        orderBy: { id: 'asc' },
      });
      expect(result.prevCursor).not.toBeNull(); // has a cursor → has prev
    });

    it('should use WHERE id < beforeId DESC and reverse when prevCursor is provided (backward)', async () => {
      const prevCursorId = mockUsers[2].id;
      const prevCursor = encodeCursor(prevCursorId);
      // Repo returns items in DESC order (reversed in service)
      userRepository.findAll.mockResolvedValue([mockUsers[1], mockUser]);

      const result = await service.getAllCursor(undefined, prevCursor, limit);

      expect(userRepository.findAll).toHaveBeenCalledWith({
        where: { id: { lt: prevCursorId } },
        take: limit + 1,
        orderBy: { id: 'desc' },
      });
      // Items are reversed: mockUser first, then mockUsers[1]
      expect(result.items[0].id).toBe(mockUser.id);
      expect(result.items[1].id).toBe(mockUsers[1].id);
    });

    it('nextCursor encodes the last items id', async () => {
      const threeItems = [mockUser, mockUsers[1], mockUsers[2]];
      userRepository.findAll.mockResolvedValue(threeItems);

      const result = await service.getAllCursor(undefined, undefined, limit);

      // Last of trimmed items is mockUsers[1]
      expect(result.nextCursor).toBe(encodeCursor(mockUsers[1].id));
    });
  });
});
