import fs from 'fs';
import path from 'path';

export class ChatIdManager {
  private activeChats: number[] = [];

  constructor() {
    this.loadCurrentState();
  }

  addChat(chatId: number) {
    if (!this.activeChats.includes(chatId)) {
      this.activeChats.push(chatId);
      this.saveCurrentState();
    }
  }

  removeChat(chatId: number) {
    this.activeChats = this.activeChats.filter((id) => id !== chatId);
    this.saveCurrentState();
  }

  getChats() {
    return this.activeChats;
  }

  private loadCurrentState() {
    if (!fs.existsSync( path.join(__dirname, 'state'))) {
      fs.mkdirSync( path.join(__dirname, 'state'));
    }
    const statePath = path.join(__dirname, 'state', 'ChatIdsState.json');
    if (!fs.existsSync(statePath)) {
      fs.writeFileSync(statePath, JSON.stringify({ activeChats: [] }));
    }
    const state = JSON.parse(fs.readFileSync(statePath).toString());
    this.activeChats = state.activeChats;
  }

  saveCurrentState() {
    fs.writeFileSync(
      path.join(__dirname, 'state', 'ChatIdsState.json'),
      JSON.stringify({ activeChats: this.activeChats })
    );
  }
}