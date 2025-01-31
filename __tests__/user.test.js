const UserRepository = require('../src/repository/user');
const sqlDB = require('../src/config/sql.js');
const { DB: mongoDB } = require('../src/config/mongo.js');

jest.mock('../src/config/sql.js', () => jest.fn());
jest.mock('../src/config/mongo.js', () => {
    const mockUser = {
        findOne: jest.fn(),
        create: jest.fn(),
        findOneAndUpdate: jest.fn()
      };
    
      return {
        connectToDB: jest.fn(),
        DB: {
          User: mockUser,
        }
    }
});

describe('UserRepository', () => {
  let sqlUserRepository;
  let mongoUserRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    
    sqlUserRepository = new UserRepository('sql');
    mongoUserRepository = new UserRepository('mongo');
  });

  describe('constructor', () => {
    test('should set dbType to sql when sql is passed', () => {
      const repository = new UserRepository('sql');
      expect(repository.dbType).toBe('sql');
    });

    test('should set dbType to mongo when mongo is passed', () => {
      const repository = new UserRepository('mongo');
      expect(repository.dbType).toBe('mongo');
    });
  });

  describe('findUser', () => {
    const mockEmail = 'test@example.com';
    const mockUser = { 
      id: '1', 
      email: mockEmail, 
      name: 'Test User' 
    };

    test('should throw error if findUser fails', async () => {
      sqlDB.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockRejectedValue(new Error('Find user failed'))
      });

      await expect(sqlUserRepository.findUser(mockEmail)).rejects.toThrow('Find user failed');
    });
  });

  describe('findOne', () => {
    const mockFilter = { email: 'test@example.com' };
    const mockUser = { 
      id: '1', 
      email: 'test@example.com', 
      name: 'Test User' 
    };

    test('SQL: should find user with simple filter', async () => {
      sqlDB.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await sqlUserRepository.findOne(mockFilter);
      
      expect(sqlDB().where).toHaveBeenCalledWith('email', 'test@example.com');
      expect(result).toEqual(mockUser);
    });

    test('SQL: should handle complex filters with operators', async () => {
      const complexFilter = { 
        created_at: { '$gt': new Date('2023-01-01') },
        age: { '$lt': 30 }
      };

      sqlDB.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await sqlUserRepository.findOne(complexFilter);
      
      expect(sqlDB().where).toHaveBeenCalledWith('created_at', '>', new Date('2023-01-01'));
      expect(sqlDB().where).toHaveBeenCalledWith('age', '<', 30);
      expect(result).toEqual(mockUser);
    });

    test('MongoDB: should find user with filter', async () => {
      // Mock the findOne method
      mongoDB.User.findOne.mockResolvedValue(mockUser);

      const result = await mongoUserRepository.findOne(mockFilter);
      
      expect(mongoDB.User.findOne).toHaveBeenCalledWith(mockFilter);
      expect(result).toEqual(mockUser);
    });

    test('SQL: should throw error for unsupported complex operators', async () => {
      const invalidFilter = { 
        created_at: { '$exists': true }
      };

      await expect(sqlUserRepository.findOne(invalidFilter)).rejects.toThrow('Unsupported operator');
    });
  });

  describe('createUser', () => {
    const mockUserData = { 
      email: 'test@example.com', 
      password: 'hashedpassword', 
      name: 'Test User' 
    };

    test('SQL: should create a user', async () => {

        const timestamp = jest.fn(() => 'current_timestamp');
        
        sqlDB.mockReturnValue({
          insert: jest.fn().mockResolvedValue([1])
        });
    
        sqlDB.fn = { 
          now: timestamp
        };
      
        const userId = await sqlUserRepository.createUser(mockUserData);
        
        expect(sqlDB().insert).toHaveBeenCalledWith(expect.objectContaining({
          email: mockUserData.email,
          password: mockUserData.password,
          name: mockUserData.name,
          created_at: 'current_timestamp'
        }));
        expect(userId).toBe(1);
        
        expect(timestamp).toHaveBeenCalled();
      });

    test('MongoDB: should create a user', async () => {
     
      const mockCreatedUser = { 
        ...mockUserData, 
        id: 'mongo-user-id' 
      };
      mongoDB.User.create.mockResolvedValue(mockCreatedUser);

      const userId = await mongoUserRepository.createUser(mockUserData);
      
      expect(mongoDB.User.create).toHaveBeenCalledWith(mockUserData);
      expect(userId).toBe('mongo-user-id');
    });
  });

  describe('updateUser', () => {
    const mockFilter = { email: 'test@example.com' };
    const mockUpdateData = { name: 'Updated Name' };

    test('SQL: should update a user', async () => {  
        const whereMock = jest.fn().mockReturnThis();
        const updateMock = jest.fn().mockResolvedValue(1);
    
        sqlDB.mockImplementation(() => ({
          where: whereMock,
          update: (data) => {
            updateMock(data);
            return Promise.resolve(1);
          }
        }));
      
        const timestamp = jest.fn(() => 'current_timestamp');
        sqlDB.fn = { 
          now: timestamp 
        };
        await sqlUserRepository.updateUser(mockFilter, mockUpdateData);
        
        expect(whereMock).toHaveBeenCalledWith(mockFilter);
        
        expect(updateMock).toHaveBeenCalledWith({
          ...mockUpdateData,
          updated_at: 'current_timestamp'
        });
        expect(timestamp).toHaveBeenCalled();
      });

    test('MongoDB: should update a user', async () => {
      mongoDB.User.findOneAndUpdate.mockResolvedValue({});

      await mongoUserRepository.updateUser(mockFilter, mockUpdateData);
      
      expect(mongoDB.User.findOneAndUpdate).toHaveBeenCalledWith(
        mockFilter, 
        { $set: mockUpdateData }
      );
    });
  });
});