export class Plugin {
  app: any;
  manifest: any;

  constructor(app: any, manifest: any) {
    this.app = app;
    this.manifest = manifest;
  }

  async onload() {}
  async onunload() {}
  registerEvent(event: any) {
    return event;
  }
}

export class TFolder {
  path: string;
  name: string;
  children: any[] = [];
  parent: any = null;
  vault: any = null;

  constructor(path: string, name: string) {
    this.path = path;
    this.name = name;
  }
}

export class Menu {
  items: any[] = [];

  addItem(callback: (item: any) => void) {
    const item = {
      setTitle: jest.fn().mockReturnThis(),
      setIcon: jest.fn().mockReturnThis(),
      onClick: jest.fn().mockReturnThis(),
    };
    callback(item);
    this.items.push(item);
    return this;
  }
}

export class Notice {
  constructor(message: string) {
    // Mock notice
  }
}
