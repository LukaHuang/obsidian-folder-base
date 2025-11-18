import FolderBaseCreatorPlugin from '../main';
import { TFolder } from 'obsidian';

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Mock Obsidian API - use TFolder from mock
class MockTFolder extends TFolder {
  constructor(path: string, name: string) {
    super(path, name);
  }
}

class MockVault {
  files: Map<string, any> = new Map();
  shouldThrowError: boolean = false;

  getAbstractFileByPath(path: string) {
    return this.files.get(path) || null;
  }

  async create(path: string, content: string) {
    if (this.shouldThrowError) {
      throw new Error('Vault error: Permission denied');
    }
    this.files.set(path, { path, content });
    return { path, content };
  }
}

class MockWorkspace {
  private leaf: any;
  private eventCallbacks: Map<string, any> = new Map();

  constructor() {
    this.leaf = {
      openFile: jest.fn(),
    };
  }

  getLeaf() {
    return this.leaf;
  }

  on(event: string, callback: any) {
    this.eventCallbacks.set(event, callback);
    return { unload: jest.fn() };
  }

  trigger(event: string, ...args: any[]) {
    const callback = this.eventCallbacks.get(event);
    if (callback) {
      callback(...args);
    }
  }
}

class MockApp {
  vault: MockVault;
  workspace: MockWorkspace;

  constructor() {
    this.vault = new MockVault();
    this.workspace = new MockWorkspace();
  }
}

describe('FolderBaseCreatorPlugin', () => {
  let plugin: FolderBaseCreatorPlugin;
  let mockApp: MockApp;

  beforeEach(() => {
    mockApp = new MockApp();
    plugin = new FolderBaseCreatorPlugin(mockApp as any, {} as any);
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('generateBaseContent', () => {
    it('should generate correct YAML content for a folder', () => {
      const folderPath = 'test/folder';
      const content = plugin.generateBaseContent(folderPath);

      expect(content).toContain('filters:');
      expect(content).toContain('file.inFolder(this.file.folder)');
      expect(content).toContain('file.ext == "md"');
      expect(content).toContain('properties:');
      expect(content).toContain('file.name:');
      expect(content).toContain('file.mtime:');
      expect(content).toContain('views:');
      expect(content).toContain('type: table');
    });

    it('should create a valid YAML structure', () => {
      const content = plugin.generateBaseContent('any/path');

      // Check YAML structure
      expect(content).toMatch(/^filters:/m);
      expect(content).toMatch(/^\s+and:/m);
      expect(content).toMatch(/^properties:/m);
      expect(content).toMatch(/^views:/m);
    });

    it('should include both filter conditions', () => {
      const content = plugin.generateBaseContent('test/path');

      // Should have both folder and file extension filters in the filters section
      const filtersMatch = content.match(/filters:[\s\S]*?properties:/);
      expect(filtersMatch).toBeTruthy();
      if (filtersMatch) {
        expect(filtersMatch[0]).toContain('file.inFolder(this.file.folder)');
        expect(filtersMatch[0]).toContain('file.ext == "md"');
      }
    });
  });

  describe('createBaseForFolder', () => {
    it('should create a base file with correct name', async () => {
      const folder = new MockTFolder('test/folder', 'folder');

      await plugin.createBaseForFolder(folder as any);

      const expectedPath = 'test/folder/folder.base';
      const file = mockApp.vault.files.get(expectedPath);

      expect(file).toBeDefined();
      expect(file.path).toBe(expectedPath);
    });

    it('should create base file with correct content', async () => {
      const folder = new MockTFolder('notes/projects', 'projects');

      await plugin.createBaseForFolder(folder as any);

      const expectedPath = 'notes/projects/projects.base';
      const file = mockApp.vault.files.get(expectedPath);

      expect(file.content).toContain('file.inFolder(this.file.folder)');
      expect(file.content).toContain('file.ext == "md"');
    });

    it('should not create duplicate base file', async () => {
      const folder = new MockTFolder('test/folder', 'folder');

      // Create first base
      await plugin.createBaseForFolder(folder as any);

      // Try to create again
      const createSpy = jest.spyOn(mockApp.vault, 'create');
      await plugin.createBaseForFolder(folder as any);

      // Should only be called once (the first time)
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('should handle root folder correctly', async () => {
      const folder = new MockTFolder('', 'root');

      await plugin.createBaseForFolder(folder as any);

      const expectedPath = '/root.base';
      const file = mockApp.vault.files.get(expectedPath);

      expect(file).toBeDefined();
    });

    it('should handle nested folders', async () => {
      const folder = new MockTFolder('level1/level2/level3', 'level3');

      await plugin.createBaseForFolder(folder as any);

      const expectedPath = 'level1/level2/level3/level3.base';
      const file = mockApp.vault.files.get(expectedPath);

      expect(file).toBeDefined();
      expect(file.path).toBe(expectedPath);
    });
  });

  describe('Base content validation', () => {
    it('should generate content that includes displayName properties', () => {
      const content = plugin.generateBaseContent('test');

      expect(content).toContain('displayName: "Name"');
      expect(content).toContain('displayName: "Modified"');
    });

    it('should generate content with table view type', () => {
      const content = plugin.generateBaseContent('test');

      expect(content).toContain('type: table');
      expect(content).toContain('name: "Files in current folder"');
    });

    it('should order by file name', () => {
      const content = plugin.generateBaseContent('test');

      expect(content).toContain('order:');
      expect(content).toContain('- file.name');
    });
  });

  describe('Plugin lifecycle', () => {
    it('should log message on load', async () => {
      await plugin.onload();

      expect(mockConsoleLog).toHaveBeenCalledWith('Loading Folder Base Creator plugin');
    });

    it('should register file-menu event on load', async () => {
      const onSpy = jest.spyOn(mockApp.workspace, 'on');

      await plugin.onload();

      expect(onSpy).toHaveBeenCalledWith('file-menu', expect.any(Function));
    });

    it('should log message on unload', () => {
      plugin.onunload();

      expect(mockConsoleLog).toHaveBeenCalledWith('Unloading Folder Base Creator plugin');
    });
  });

  describe('File menu integration', () => {
    it('should add menu item for folders', async () => {
      await plugin.onload();

      const mockMenu = {
        items: [],
        addItem: jest.fn(function(callback: any) {
          const item = {
            setTitle: jest.fn().mockReturnThis(),
            setIcon: jest.fn().mockReturnThis(),
            onClick: jest.fn().mockReturnThis(),
          };
          callback(item);
          this.items.push(item);
          return this;
        }),
      };

      const folder = new MockTFolder('test/folder', 'folder');

      // Simulate file-menu event
      mockApp.workspace.trigger('file-menu', mockMenu, folder);

      expect(mockMenu.addItem).toHaveBeenCalled();
      expect(mockMenu.items.length).toBe(1);
      expect(mockMenu.items[0].setTitle).toHaveBeenCalledWith('Create a base of folder');
      expect(mockMenu.items[0].setIcon).toHaveBeenCalledWith('table');
    });

    it('should not add menu item for non-folders', async () => {
      await plugin.onload();

      const mockMenu = {
        items: [],
        addItem: jest.fn(),
      };

      const file = { path: 'test/file.md', name: 'file.md' };

      // Simulate file-menu event with a regular file (not TFolder)
      mockApp.workspace.trigger('file-menu', mockMenu, file);

      expect(mockMenu.addItem).not.toHaveBeenCalled();
    });

    it('should trigger createBaseForFolder when menu item clicked', async () => {
      await plugin.onload();

      const createSpy = jest.spyOn(plugin, 'createBaseForFolder');
      const folder = new MockTFolder('test/folder', 'folder');

      const mockMenu = {
        addItem: jest.fn((callback: any) => {
          const item = {
            setTitle: jest.fn().mockReturnThis(),
            setIcon: jest.fn().mockReturnThis(),
            onClick: jest.fn((clickCallback: any) => {
              clickCallback();
              return item;
            }),
          };
          callback(item);
        }),
      };

      mockApp.workspace.trigger('file-menu', mockMenu, folder);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(createSpy).toHaveBeenCalledWith(folder);
    });
  });

  describe('Error handling', () => {
    it('should handle vault creation errors gracefully', async () => {
      mockApp.vault.shouldThrowError = true;
      const folder = new MockTFolder('test/folder', 'folder');

      await plugin.createBaseForFolder(folder as any);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error creating base:',
        expect.any(Error)
      );
    });

    it('should not throw when file creation fails', async () => {
      mockApp.vault.shouldThrowError = true;
      const folder = new MockTFolder('test/folder', 'folder');

      await expect(plugin.createBaseForFolder(folder as any)).resolves.not.toThrow();
    });

    it('should log error message when creation fails', async () => {
      mockApp.vault.shouldThrowError = true;
      const folder = new MockTFolder('test/folder', 'folder');

      await plugin.createBaseForFolder(folder as any);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error creating base:',
        expect.objectContaining({
          message: 'Vault error: Permission denied'
        })
      );
    });
  });

  describe('File opening', () => {
    it('should open newly created base file', async () => {
      const folder = new MockTFolder('test/folder', 'folder');
      const openFileSpy = jest.spyOn(mockApp.workspace.getLeaf(), 'openFile');

      await plugin.createBaseForFolder(folder as any);

      expect(openFileSpy).toHaveBeenCalled();
    });

    it('should handle case when base file cannot be retrieved after creation', async () => {
      const folder = new MockTFolder('test/folder', 'folder');

      // Override getAbstractFileByPath to return null after creation
      const originalGet = mockApp.vault.getAbstractFileByPath.bind(mockApp.vault);
      let callCount = 0;
      jest.spyOn(mockApp.vault, 'getAbstractFileByPath').mockImplementation((path: string) => {
        callCount++;
        if (callCount === 1) {
          return null; // First call: check if exists
        }
        return null; // Second call: after creation, still null (edge case)
      });

      await plugin.createBaseForFolder(folder as any);

      const openFileSpy = mockApp.workspace.getLeaf().openFile;
      expect(openFileSpy).not.toHaveBeenCalled();
    });
  });
});
