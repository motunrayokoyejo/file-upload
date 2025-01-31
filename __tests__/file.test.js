const FileRepository = require('../src/repository/file');
const sqlDB = require('../src/config/sql.js');
const { DB: mongoDB } = require('../src/config/mongo.js');

jest.mock('../src/config/sql.js', () => jest.fn());
jest.mock('../src/config/mongo.js', () => ({
  DB: {
    File: {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      deleteOne: jest.fn()
    }
  }
}));

describe('FileRepository', () => {
  let sqlFileRepository;
  let mongoFileRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    sqlFileRepository = new FileRepository('sql');
    mongoFileRepository = new FileRepository('mongo');
  });

  describe('createFile', () => {
    const mockFileData = { 
      user_id: 'user123', 
      filename: 'test.txt', 
      created_at: new Date() 
    };

    test('SQL: should create a file successfully', async () => {
      sqlDB.mockReturnValue({
        insert: jest.fn().mockResolvedValue(true)
      });

      await expect(sqlFileRepository.createFile(mockFileData)).resolves.not.toThrow();
      expect(sqlDB().insert).toHaveBeenCalledWith(mockFileData);
    });

    test('MongoDB: should create a file successfully', async () => {
      mongoDB.File.create.mockResolvedValue(true);

      await expect(mongoFileRepository.createFile(mockFileData)).resolves.not.toThrow();
      expect(mongoDB.File.create).toHaveBeenCalledWith(mockFileData);
    });

    test('should throw error if file creation fails', async () => {
      sqlDB.mockReturnValue({
        insert: jest.fn().mockRejectedValue(new Error('Insert failed'))
      });

      await expect(sqlFileRepository.createFile(mockFileData)).rejects.toThrow('Insert failed');
    });
  });

  describe('findAllFilesForUser', () => {
    const mockUserId = 'user123';
    const mockFiles = [
      { id: '1', filename: 'file1.txt' },
      { id: '2', filename: 'file2.txt' }
    ];

    test('SQL: should find all files for a user', async () => {
      sqlDB.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockFiles)
      });

      const result = await sqlFileRepository.findAllFilesForUser(mockUserId);
      
      expect(sqlDB().where).toHaveBeenCalledWith({ user_id: mockUserId });
      expect(sqlDB().orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(result).toEqual(mockFiles);
    });

    test('MongoDB: should find all files for a user', async () => {
      const findMock = {
        sort: jest.fn().mockResolvedValue(mockFiles)
      };
      mongoDB.File.find.mockReturnValue(findMock);

      const result = await mongoFileRepository.findAllFilesForUser(mockUserId);
      
      expect(mongoDB.File.find).toHaveBeenCalledWith({ user_id: mockUserId });
      expect(findMock.sort).toHaveBeenCalledWith({ created_at: -1 });
      expect(result).toEqual(mockFiles);
    });
  });

  describe('findFileForUser', () => {
    const mockUserId = 'user123';
    const mockFileId = 'file123';
    const mockFile = { id: mockFileId, filename: 'test.txt' };

    test('SQL: should find a specific file for a user', async () => {
      sqlDB.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockFile)
      });

      const result = await sqlFileRepository.findFileForUser(mockUserId, mockFileId);
      
      expect(sqlDB().where).toHaveBeenCalledWith({ user_id: mockUserId, id: mockFileId });
      expect(result).toEqual(mockFile);
    });

    test('MongoDB: should find a specific file for a user', async () => {
      mongoDB.File.findOne.mockResolvedValue(mockFile);

      const result = await mongoFileRepository.findFileForUser(mockUserId, mockFileId);
      
      expect(mongoDB.File.findOne).toHaveBeenCalledWith({ user_id: mockUserId, id: mockFileId });
      expect(result).toEqual(mockFile);
    });
  });

  describe('deleteFile', () => {
    const mockUserId = 'user123';
    const mockFileId = 'file123';

    test('SQL: should delete a file', async () => {
      sqlDB.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        delete: jest.fn().mockResolvedValue(true)
      });

      await expect(sqlFileRepository.deleteFile(mockFileId, mockUserId)).resolves.not.toThrow();
      
      expect(sqlDB().where).toHaveBeenCalledWith({ id: mockFileId, user_id: mockUserId });
      expect(sqlDB().delete).toHaveBeenCalled();
    });

    test('MongoDB: should delete a file', async () => {
      mongoDB.File.deleteOne.mockResolvedValue(true);

      await expect(mongoFileRepository.deleteFile(mockFileId, mockUserId)).resolves.not.toThrow();
      
      expect(mongoDB.File.deleteOne).toHaveBeenCalledWith({ _id: mockFileId, user_id: mockUserId });
    });
  });
});