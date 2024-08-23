import readline from 'readline';
import { Client, Collection, RichPresence, TextChannel, DMChannel, VoiceChannel, Permissions, Role, CategoryChannel, Guild, Message, Snowflake } from 'discord.js-selfbot-v13';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const client = new Client({});

process.title = 'Multi-tool';

interface Settings {
  token: string;
  trigger: string;
  whitelist: string[];
  whiteListServers: string[];
  stateRPC: boolean;
}

let settings: Settings = {
  token: '',
  trigger: '',
  whitelist: [],
  whiteListServers: [],
  stateRPC: true,
};

let defaultSettings: Settings = {
  token: '',
  trigger: '',
  whitelist: [],
  whiteListServers: [],
  stateRPC: true,
};

const settingsFilePath = path.resolve(__dirname, 'settings.json');

if (fs.existsSync(settingsFilePath)) {
  const fileContent = fs.readFileSync(settingsFilePath, 'utf-8');
  const loadedSettings: Partial<Settings> = JSON.parse(fileContent);

  settings = { ...defaultSettings, ...loadedSettings };
} else {
  settings = defaultSettings;
}

fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf-8');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const colors = {
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  purple: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m"
};

const colorful = (color: string, text: string, reset = '\x1b[0m') => color + text + reset;

const banner = `
  ██╗   ██╗██╗ ██████╗████████╗██╗███╗   ███╗███████╗
  ██║   ██║██║██╔════╝╚══██╔══╝██║████╗ ████║██╔════╝
  ██║   ██║██║██║        ██║   ██║██╔████╔██║███████╗
  ╚██╗ ██╔╝██║██║        ██║   ██║██║╚██╔╝██║╚════██║
   ╚████╔╝ ██║╚██████╗   ██║   ██║██║ ╚═╝ ██║███████║
    ╚═══╝  ╚═╝ ╚═════╝   ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝
                                                   `;

let loggedInUser: string = '';
const version = "1.65";

const loadSettings = () => {
  if (fs.existsSync(settingsFilePath)) {
    const fileData = fs.readFileSync(settingsFilePath, 'utf8');
    settings = JSON.parse(fileData);
    if (!Array.isArray(settings.whitelist)) {
      settings.whitelist = [];
    }
  }
};

const saveSettings = () => {
  fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
};

const fileUrl = 'https://raw.githubusercontent.com/Victims-Team/Multi-tool/main/src/index.ts';

async function checarUpdates(versionAtual: string): Promise<boolean> {
  try {
    const resposta = await fetch("https://api.github.com/repos/Victims-Team/Multi-tool/releases/latest");
    const dados = await resposta.json();
    const latestVersion = dados.body;

    return latestVersion !== versionAtual;
  } catch (erro) {
    console.error('Erro ao verificar atualizações:', erro);
    return false;
  }
}

async function atualizarArquivo() {
  try {
    const resposta = await fetch(fileUrl);
    const novoConteudo = await resposta.text();
    const filePath = path.resolve(__dirname, 'index.ts'); 
    
    fs.writeFileSync(filePath, novoConteudo);
    console.log('     [=] Atualizado com sucesso, inicie novamente o programa!');
  } catch (erro) {
    console.error('     Erro ao atualizar o arquivo:', erro);
  }
}

client.once('ready', async () => {
  console.clear();
  loggedInUser = client.user?.username || '';

  if (!loggedInUser) {
    console.log(colorful(colors.purple, banner));
    console.log(colorful(colors.purple, '     [x] Você está deslogado. Por favor, faça login.'));
    updateToken();
  } else {
    const temAtualizacao = await checarUpdates(version);

    if (temAtualizacao) {
      console.clear();
      console.log(colorful(colors.purple, banner));
      console.log('     [+] Há uma nova atualização disponível!');
      console.log('     Digite "yes" para atualizar o arquivo ou qualquer outra tecla para continuar.');
      
      rl.question('', async (input) => {
      });
      return;
    }

    showMenu();
  }
});

const showMenu = () => {
  setStatus(client, 'Standing on the dashboard');
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, `     [=] Bem-vindo, ${loggedInUser}!`));
  console.log(colorful(colors.purple, '     [=] Escolha uma função:'));
  console.log("");
  console.log(colorful(colors.green, '     [1] Limpar DM ou Canal.'));
  console.log(colorful(colors.green, '     [2] Limpar todas as DMs abertas.'));
  console.log(colorful(colors.green, '     [3] Limpar DM de Amigos.'));
  console.log(colorful(colors.green, '     [4] Definir Palavra-chave do Trigger.'));
  console.log(colorful(colors.green, '     [5] Remover Amizades.'));
  console.log(colorful(colors.green, '     [6] Clonar servidor. ( Sem perm em canais )'));
  console.log(colorful(colors.green, '     [7] Remover Servidores.'));
  console.log(colorful(colors.green, '     [8] Fechar todas as DMs.'));
  console.log(colorful(colors.green, '     [9] WhiteList.'));
  console.log(colorful(colors.green, '     [10] Utilidades em Call.'));
  console.log(colorful(colors.green, '     [11] Utildiades em Chat.'));
  console.log(colorful(colors.green, '     [99] Configuracoes.'));
  console.log(colorful(colors.green, '     [0] Fechar.'));
  console.log("");

  rl.question('     [-] Escolha de acordo:  ', (choice) => {
    switch (choice) {
      case '1': clearDm(); break;
      case '2': clearOpenDMs(); break;
      case '3': clearDmFriends(); break;
      case '4': setTrigger(); break;
      case '5': removeFriends(); break;
      case '6': cloneServer(); break;
      case '7': removeServers(); break;
      case '8': deleteDms(); break;
      case '9': questionWhiteList(); break;
      case '10': utilInVoice(); break;
      case '11': utilInChannel(); break;
      case '99': questionConfig(); break;
      case 'yes': atualizarArquivo(); break;
      case '0': process.exit(); break;
      default: 
        console.log('Escolha apenas as funções acima.');
        showMenu();
    }
  });
};

client.on('messageCreate', async (message: Message) => {
  if (!message.content || message.author.id === client.user?.id || message.content.trim() === '' || message.system) {
    return;
  }

  if (message.content === settings.trigger) {
    try {
      let channel: TextChannel | DMChannel | null = null;
      if (message.channel instanceof DMChannel) {
        channel = message.channel;
      } else {
        channel = await client.channels.fetch(message.channel.id) as TextChannel;
      }

      if (!channel || !channel.isText()) {
        return;
      }

      let count = 0;
      let lastId: string | undefined;
      let messages;

      do {
        messages = await channel.messages.fetch({ limit: 100, ...(lastId && { before: lastId }) });
        if (messages.size === 0) break;

        const sortedMessages = Array.from(messages.values()).sort((a, b) => b.createdTimestamp - a.createdTimestamp);

        for (const msg of sortedMessages) {
          if (!msg.system && msg.author.id === client.user?.id) {
            await msg.delete();
          }
          lastId = msg.id;
        }
      } while (messages.size > 0);

    } catch (error) {
      console.log('     [x] Ocorreu um erro:', error);
    }
  }
});

const clearDm = () => {
  setStatus(client, 'Utilizando Clear DM')
  rl.question('     [-] Insira o ID do usuário ou do canal: ', (id) => {
    rl.question('     [-] Deseja começar a limpar de cima para baixo (1) ou de baixo para cima (2)? ', (direction) => {
      const isBottomToTop = direction === '2';
      cleanMessages(id, isBottomToTop);
    });
  });
};

const cleanMessages = async (id: string, isBottomToTop: boolean) => {
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, `     [x] Utilizando Clear DM...`));
  setStatus(client, "Utilizando Clear DM")

  try {
    let channel: TextChannel | DMChannel | null = null;
    let user = null;

    try {
      user = await client.users.fetch(id);
      channel = await user.createDM();
    } catch {
      try {
        channel = await client.channels.fetch(id) as TextChannel;
      } catch {
        console.log('     [x] Canal ou usuário inválido.');
        showMenu();
        return;
      }
    }

    if (!channel || !channel.isText()) {
      console.log('     [x] Canal ou usuário inválido.');
      showMenu();
      return;
    }

    let count = 0;
    let userMessagesCount = 0;
    let lastId: string | undefined;
    let messages;

    do {
      messages = await channel.messages.fetch({ limit: 100, ...(lastId && { [isBottomToTop ? 'before' : 'after']: lastId }) });
      if (messages.size === 0 && count === 0) {
        console.log('     [=] Sem mensagens encontradas, retornando ao menu.');
        showMenu();
        return;
      }
      if (messages.size === 0) break;

      const sortedMessages = isBottomToTop ? Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp) : Array.from(messages.values()).sort((a, b) => b.createdTimestamp - a.createdTimestamp);

      for (const message of sortedMessages) {
        if (!message.system && message.author.id === client.user?.id) {
          await message.delete();
          count++;
          userMessagesCount++;
          console.log(`     [ + ] Deletando ${userMessagesCount} mensagem do usuário em: ${channel instanceof DMChannel ? user?.tag : (channel as TextChannel).name}`);
        }
        lastId = message.id;
      }
    } while (messages.size > 0);

    console.log(`     [✓] Limpeza concluída. Total de mensagens do usuário deletadas: ${userMessagesCount}`);
    startCountdown(5);
  } catch (error) {
    console.log('     [x] Ocorreu um erro:', error);
    startCountdown(5);
  }
};

const clearOpenDMs = async () => {
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, `     [x] Utilizando Clear DM's...`));
  setStatus(client, "Utilizando Clear DM's");

  const dms = client.channels.cache.filter(channel => channel.type === 'DM') as Collection<string, DMChannel>;
  const whitelistSet = new Set(settings.whitelist); 

  if (dms.size === 0) {
    console.log('     [=] Não há DMs abertas.');
    showMenu();
    return;
  }

  for (const dm of dms.values()) {
    if (whitelistSet.has(dm.recipient?.id || '')) {
      console.log(`     [=] DM com ${dm.recipient?.username} está na white list, pulando...`);
      continue;
    }

    let count = 0;
    let lastId: string | undefined;
    let messages: Collection<string, Message>;

    do {
      messages = await dm.messages.fetch({ limit: 100, ...(lastId && { before: lastId }) });
      if (messages.size === 0) {
        console.log('     [=] Sem mensagens nessa DM, passando para a próxima.');
        break;
      }

      const sortedMessages = Array.from(messages.values()).sort((a, b) => b.createdTimestamp - a.createdTimestamp);

      for (const message of sortedMessages) {
        if (message.author.id === client.user?.id) {
          count++;
          if (!message.system) {
            await message.delete();
            console.log(`     [ + ] Deletando mensagem ${count} do usuário em: DM com ${dm.recipient?.tag}`);
          }
        }
        lastId = message.id;
      }
    } while (messages.size > 0);

    if (count > 0) {
      console.log(`     [✓] Limpeza concluída na DM com ${dm.recipient?.tag}. Total de mensagens deletadas: ${count}`);
    } else {
      console.log(`     [=] Não houve mensagens para deletar na DM com ${dm.recipient?.tag}.`);
    }
    await dm.delete();
    console.log(`     [✓] DM com ${dm.recipient?.tag} fechada.`);
  }

  startCountdown(5);
};

const deleteDms = async () => {
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, `     [x] Utilizando Clear DM's...`));
  setStatus(client, "Utilizando Clear DM's");

  const dms = client.channels.cache.filter(channel => channel.type === 'DM') as Collection<string, DMChannel>;
  const whitelistSet = new Set(settings.whitelist); 
  const dmCount = dms.size;

  for (const dm of dms.values()) {
    if (whitelistSet.has(dm.recipient?.id || '')) {
      console.log(`     [=] DM com ${dm.recipient?.username} está na white list, pulando...`);
      continue;
    }

    let count = 0

    await dm.delete();
    console.log(`     [✓] DM com ${dm.recipient?.tag} fechada.`);
  }

  startCountdown(5)
}

const requestFriends = async (client: any) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  try {
    const res = await axios.get('https://discord.com/api/v9/users/@me/relationships', {
      headers: {
        'Authorization': client.token,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'X-Super-Properties': 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6InB0LUJSIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzExMC4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiMTEwLjAuMC4wIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tLyIsInJlZmVycmluZ19kb21haW4iOiJkaXNjb3JkLmNvbSIsInJlZmVycmVyX2N1cnJlbnQiOiIiLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjoxODU1MTYsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGwsImRlc2lnbl9pZCI6MH0=',
        'Referer': 'https://discord.com/channels/@me'
      }
    });
    return res.data;
  } catch (error) {
    console.error('Failed to fetch friends:', error);
    return [];
  }
};

const removeFriends = async () => {
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, '     [x] Removendo amizades...'));
  setStatus(client, "Removendo Amizades");

  const friends = await requestFriends(client);
  const whitelist = settings.whitelist; 
  const friendCount = friends.length;
  let count = 0;

  for (const friend of friends) {
    if (whitelist.includes(friend.id)) {
      console.log(colorful(colors.yellow, `     [=] Amizade ${friend.username} (${friend.id}) está na white list e não será removida.`));
      continue;
    }

    try {
      await axios.delete(`https://discord.com/api/v9/users/@me/relationships/${friend.id}`, {
        headers: {
          'Authorization': client.token,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'X-Super-Properties': 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6InB0LUJSIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzExMC4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiMTEwLjAuMC4wIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tLyIsInJlZmVycmluZ19kb21haW4iOiJkaXNjb3JkLmNvbSIsInJlZmVycmVyX2N1cnJlbnQiOiIiLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjoxODU1MTYsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGwsImRlc2lnbl9pZCI6MH0=',
          'Referer': 'https://discord.com/channels/@me'
        }
      });
      count++;
      console.log(colorful(colors.purple, `     [x] Amizade removida: ${friend.username} (${count}/${friendCount})`));
    } catch (error) {
      console.error(colorful(colors.red, `     [x] Erro ao remover amizade: ${friend.username}`));
    }
  }
  console.log(colorful(colors.purple, `     [x] Todas as amizades foram processadas!`));
};

const removeServers = async () => {
  const servers = client.guilds.cache.map((server) => server);
  const whitelist = settings.whiteListServers;

  for (const server of servers) {
    if (whitelist.includes(server.id)) {
      console.log(colorful(colors.yellow, `     [=] Servidor ${server.name} (${server.id}) está na white list e não será removido.`));
      continue;
    }

    try {
      await server.leave();
      console.log(colorful(colors.purple, `     [x] Servidor removido: ${server.name} (${servers.indexOf(server) + 1}/${servers.length})`));
    } catch (error) {
      console.error(colorful(colors.red, `     [x] Erro ao remover servidor: ${server.name}`));
    }
  }
  startCountdown(5)
};

const clearDmFriends = async () => {
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, '     [x] Limpando DM de Amigos...'));
  setStatus(client, "Limpando DM de Amigos");

  const friends = await requestFriends(client);
  const whitelistSet = new Set(settings.whitelist);

  let count = 0;

  for (const friend of friends) {
    if (whitelistSet.has(friend.id)) {
      console.log(`     [=] Amigo ${friend.username} está na white list, pulando...`);
      continue;
    }

    const dm = await client.channels.cache.find(ch => ch instanceof DMChannel && (ch as DMChannel).recipient?.id === friend.id);
    if (!dm || !(dm instanceof DMChannel)) continue;

    let lastId: string | undefined;
    let messages: Collection<string, Message>;

    do {
      messages = await dm.messages.fetch({ limit: 100, ...(lastId && { before: lastId }) });
      if (messages.size === 0) break;

      const sortedMessages = Array.from(messages.values()).sort((a, b) => b.createdTimestamp - a.createdTimestamp);

      for (const msg of sortedMessages) {
        if (!msg.system && msg.author.id === client.user?.id) {
          await msg.delete();
          count++;
          console.log(`     [ + ] Deletando mensagem do usuário em: ${dm.recipient?.username}`);
        }
        lastId = msg.id;
      }
    } while (messages.size > 0);
  }

  console.log(`     [✓] Limpeza concluída. Total de mensagens deletadas: ${count}`);
  startCountdown(5);
};

const updateToken = () => {
  rl.question('     [-] Insira o novo token:  ', (token) => {
    settings.token = token;
    client.login(settings.token).then(() => {
      saveSettings();
      console.log('     Token atualizado com sucesso.');
      showMenu();
    }).catch(() => {
      console.log('     Token inválido, por favor tente novamente.');
      updateToken();
    });
  });
};

const setTrigger = () => {
  rl.question('     [-] Insira a nova palavra-chave do trigger: ', (trigger) => {
    settings.trigger = trigger;
    saveSettings();
    console.log('     Palavra-chave do trigger atualizada com sucesso.');
    showMenu();
  });
};

const cloneServer = async () => {
  rl.question('     [-] Insira o ID do servidor original: ', (originalGuildId) => {
    rl.question('     [-] Insira o ID do novo servidor: ', async (newGuildId) => {
      try {
        const originalGuild = client.guilds.cache.get(originalGuildId) as Guild;
        const newGuild = client.guilds.cache.get(newGuildId) as Guild;

        console.clear();
        console.log(colorful(colors.purple, banner));
        console.log(colorful(colors.purple, `     [x] Utilizando Server Cloner...`));
        setStatus(client, "Utilizando Server Cloner")

        if (!originalGuild || !newGuild) {
          console.log(colorful(colors.red, '     [x] Um ou ambos os servidores não foram encontrados.'));
          startCountdown(5);
          return;
        }

        await newGuild.setName(originalGuild.name);
        await newGuild.setIcon(originalGuild.iconURL() || null);

        if (originalGuild.premiumSubscriptionCount !== null && originalGuild.premiumSubscriptionCount > 0) {
          await newGuild.setBanner(originalGuild.bannerURL() || null);
        }

        const botRoleId = originalGuild.roles.cache.find(role => role.name === '@bot')?.id;
        const communityChannelIds = originalGuild.channels.cache.filter(c => c.name.startsWith('🔊')).map(c => c.id);

        const deletionPromises = [
          ...newGuild.channels.cache.filter(c => !communityChannelIds.includes(c.id)).map(channel => channel.delete().catch(error => {
            console.log(colorful(colors.red, `     [-] Erro ao deletar canal ${channel.id}`));
          })),
          ...newGuild.roles.cache.filter(role => role.id !== botRoleId && role.name !== '@everyone').map(role => role.delete().catch(error => {
            console.log(colorful(colors.red, `     [-] Erro ao deletar cargo ${role.id}`));
          }))
        ];

        await Promise.all(deletionPromises);

        const categoryMap = new Map<string, CategoryChannel>();
        const roleMap = new Map<string, Role>();

        const roles = originalGuild.roles.cache.filter(role => role.name !== '@everyone' && role.id !== botRoleId).sort((a, b) => a.position - b.position);
        for (const role of roles.values()) {
          const newRole = await newGuild.roles.create({
            name: role.name,
            color: role.color,
            hoist: role.hoist,
            position: role.position,
            permissions: role.permissions
          });
          roleMap.set(role.id, newRole);
        }

        const categories = originalGuild.channels.cache.filter(c => c instanceof CategoryChannel).sort((a, b) => a.position - b.position);
        for (const category of categories.values()) {
          const newCategory = await newGuild.channels.create(category.name, { type: 'GUILD_CATEGORY' });
          categoryMap.set(category.id, newCategory);
        }

        const createChannels = async (channels: Collection<string, TextChannel | VoiceChannel>, channelType: 'GUILD_TEXT' | 'GUILD_VOICE') => {
          for (const channel of channels.values()) {
            const parent = categoryMap.get(channel.parentId ?? '')?.id;
            const newChannel = await newGuild.channels.create(channel.name, {
              type: channelType,
              parent,
              ...(channelType === 'GUILD_TEXT' ? { topic: (channel as TextChannel).topic || undefined, nsfw: (channel as TextChannel).nsfw } : { bitrate: (channel as VoiceChannel).bitrate, userLimit: (channel as VoiceChannel).userLimit })
            });

          }
        };

        await createChannels(originalGuild.channels.cache.filter(c => c instanceof TextChannel) as Collection<string, TextChannel>, 'GUILD_TEXT');
        await createChannels(originalGuild.channels.cache.filter(c => c instanceof VoiceChannel) as Collection<string, VoiceChannel>, 'GUILD_VOICE');

        console.log(colorful(colors.green, '     [=] Servidor clonado com sucesso!'));
        startCountdown(5);
      } catch (error) {
        console.log(colorful(colors.red, '     Erro ao clonar servidor' + error));
        startCountdown(5);
      } 
    });
  });
};

const questionWhiteList = async () => {
  setStatus(client, 'Painel de White list');
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, `     [=] Bem-vindo, ${loggedInUser}!`));
  console.log(colorful(colors.purple, '     [=] Escolha uma função:'));
  console.log("");
  console.log(colorful(colors.green, '     [1] White List de Servidores.'));
  console.log(colorful(colors.green, '     [2] White List de Usuarios.'));
  console.log(colorful(colors.green, '     [0] Voltar ao Menu.'));

  rl.question('     [-] Escolha de acordo:  ', (choice) => {
    switch (choice) { 
       case '1': whitelistServers(); break;
       case '2': whitelist(); break;
       case '0': showMenu(); break;
       default: showMenu(); break;
    }
  });
};

const utilInVoice = async ()=> {
  setStatus(client, 'Utilidades em voz');
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, `     [=] Bem-vindo, ${loggedInUser}!`));
  console.log(colorful(colors.purple, '     [=] Escolha uma função:'));
  console.log("");
  console.log(colorful(colors.green, '     [1] Mover todos de 1 Canal.'));
  console.log(colorful(colors.green, '     [2] Mover todos de 1 Canal ( Loop ).'));
  console.log(colorful(colors.green, '     [3] Desconectar todos de 1 Canal.'));
  console.log(colorful(colors.green, '     [4] Desconectar todos de 1 Servidor.'));
  console.log(colorful(colors.green, '     [0] Voltar ao menu'));

  rl.question('     [-] Escolha de acordo:  ', (choice) => {
    switch (choice) {
      case '1': moveMembersToChannel(); break;
      case '2': moveMembersToChannelLoop(); break;
      case '3': disconnectMembersFromVoiceChannel(); break;
      case '4': disconnectMembersFromServer(); break;
      case '0': showMenu(); break;
      default: showMenu();
    }           
  })
};

const moveMembersToChannel = async () => {
  setStatus(client, 'Movendo todos de 1 Canal');
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, `     [=] Bem-vindo, ${loggedInUser}!`));
  console.log(colorful(colors.purple, '     [=] Escolha uma função:'));
  console.log("");
  console.log(colorful(colors.green, '     [=] Mover todos de 1 Canal.'));
  
  rl.question(colorful(colors.purple, '     [=] Digite o ID do canal de origem: '), (fromChannelId) => {
    rl.question(colorful(colors.purple, '     [=] Digite o ID do canal de destino: '), async (toChannelId) => {
      
      const fromChannel = client.channels.cache.get(fromChannelId) as VoiceChannel;
      const toChannel = client.channels.cache.get(toChannelId) as VoiceChannel;
      
      if (!fromChannel || !toChannel) {
        console.log(colorful(colors.red, '     [!] Um ou ambos os canais não foram encontrados.'));
        setTimeout(
          () => utilInVoice(), 2000
        )
        return;
      }

      if (fromChannel.type !== 'GUILD_VOICE' || toChannel.type !== 'GUILD_VOICE') {
        console.log(colorful(colors.red, '     [!] Ambos os canais devem ser canais de voz.'));
        setTimeout(
          () => utilInVoice(), 2000
        )
        return;
      }

      for (const [memberID, member] of fromChannel.members) {
        try {
          await member.voice.setChannel(toChannel);
          console.log(colorful(colors.green, `     [+] Membro ${member.user.tag} movido para ${toChannel.name}.`));
        } catch (error) {
          console.log(colorful(colors.red, `     [!] Falha ao mover ${member.user.tag}: ${error}`));
        }
      }

      console.log(colorful(colors.green, '     [=] Todos os membros foram movidos com sucesso.'));
      setTimeout(
        () => utilInVoice(), 2000
      )
    });
  });
};

const moveMembersToChannelLoop = async () => {
  setStatus(client, 'Movendo todos de 1 Canal ( Loop )');
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, `     [=] Bem-vindo, ${loggedInUser}`));
  console.log(colorful(colors.purple, '     [=] Escolha uma função:'));
  console.log("");
  console.log(colorful(colors.purple, '     [=] Mover todos de 1 Canal em Loop'));

  rl.question(colorful(colors.purple, '     [=] Digite o ID do canal de origem (ou 0 para sair): '), async (fromChannelId) => {
    if (fromChannelId === '0') {
      console.log(colorful(colors.red, '     [!] Movimentação cancelada.'));
      setTimeout(() => utilInVoice(), 2000);
      return;
    }

    const fromChannel = client.channels.cache.get(fromChannelId) as VoiceChannel;

    if (!fromChannel || fromChannel.type !== 'GUILD_VOICE') {
      console.log(colorful(colors.red, '     [!] O canal fornecido não é um canal de voz válido.'));
      setTimeout(() => utilInVoice(), 2000);
      return;
    }

    const guild = fromChannel.guild;
    const voiceChannels = guild.channels.cache.filter(channel => channel.type === 'GUILD_VOICE' && channel.id !== fromChannel.id) as Collection<Snowflake, VoiceChannel>;

    if (voiceChannels.size < 2) {
      console.log(colorful(colors.red, '     [!] Não há canais de voz suficientes no servidor.'));
      setTimeout(() => utilInVoice(), 2000);
      return;
    }

    let stopLoop = false;
    const memberIds = Array.from(fromChannel.members.keys()); 

    console.log(colorful(colors.green, '     [=] Começando a mover os membros aleatoriamente...'));

    const moveMembersContinuously = async () => {
      while (!stopLoop) {
        for (const memberID of memberIds) {
          const member = guild.members.cache.get(memberID);
          if (!member || !member.voice.channel) continue;

          const randomChannel = voiceChannels.random();

          if (randomChannel) {
            try {
              await member.voice.setChannel(randomChannel);
              process.stdout.clearLine(0);
              process.stdout.cursorTo(0);
              process.stdout.write(colorful(colors.green, `     [+] Membro ${member.user.tag} movido para ${randomChannel.name}.`));
              await new Promise(resolve => setTimeout(resolve, 500)); 
            } catch (error) {
              process.stdout.clearLine(0);
              process.stdout.cursorTo(0);
              process.stdout.write(colorful(colors.red, `     [!] Falha ao mover ${member.user.tag}: ${error}`));
            }
          }
        }
      }
    };

    moveMembersContinuously();

    rl.question(colorful(colors.purple, '\n     [=] Digite 0 a qualquer momento para parar o loop: '), (input) => {
      if (input === '0') {
        stopLoop = true;
        console.log(colorful(colors.red, '\n     [!] Movimentação em loop cancelada.'));
        setTimeout(() => utilInVoice(), 2000);
      }
    });
  });
};

const disconnectMembersFromVoiceChannel = async () => {
  setStatus(client, 'Desconectando Membros de 1 Canal');
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, `     [=] Bem-vindo, ${loggedInUser}`));
  console.log(colorful(colors.purple, '     [=] Escolha uma função:'));
  console.log("");
  console.log(colorful(colors.purple, '     [=] Desconectar Membros de 1 Canal'));

  rl.question(colorful(colors.purple, '     [=] Digite o ID do canal de origem (ou 0 para sair): '), async (fromChannelId) => {
    if (fromChannelId === '0') {
      console.log(colorful(colors.red, '     [!] Desconexão cancelada.'));
      setTimeout(() => utilInVoice(), 2000);
      return;
    }

    const fromChannel = client.channels.cache.get(fromChannelId) as VoiceChannel;

    if (!fromChannel || fromChannel.type !== 'GUILD_VOICE') {
      console.log(colorful(colors.red, '     [!] O canal fornecido não é um canal de voz válido.'));
      setTimeout(() => utilInVoice(), 2000);
      return;
    }

    console.log(colorful(colors.green, `     [=] Desconectando todos os membros do canal: ${fromChannel.name}`));

    for (const [memberID, member] of fromChannel.members) {
      try {
        await member.voice.disconnect(); 
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(colorful(colors.green, `     [+] Membro ${member.user.tag} desconectado.`));
      } catch (error) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(colorful(colors.red, `     [!] Falha ao desconectar ${member.user.tag}: ${error}`));
      }
    }

    console.log(colorful(colors.green, '\n     [=] Todos os membros foram desconectados.'));
    setTimeout(() => utilInVoice(), 2000);
  });
};

const disconnectMembersFromServer = async () => {
  setStatus(client, 'Desconectando Membros de Todos os Canais do Servidor');
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, `     [=] Bem-vindo, ${loggedInUser}`));
  console.log(colorful(colors.purple, '     [=] Escolha uma função:'));
  console.log("");
  console.log(colorful(colors.purple, '     [=] Desconectar Membros de Todos os Canais do Servidor'));

  rl.question(colorful(colors.purple, '     [=] Digite o ID do servidor (ou 0 para sair): '), async (guildId) => {
    if (guildId === '0') {
      console.log(colorful(colors.red, '     [!] Desconexão cancelada.'));
      setTimeout(() => utilInVoice(), 2000);
      return;
    }

    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
      console.log(colorful(colors.red, '     [!] O servidor fornecido não é válido.'));
      setTimeout(() => utilInVoice(), 2000);
      return;
    }

    console.log(colorful(colors.green, `     [=] Desconectando todos os membros de todos os canais de voz no servidor: ${guild.name}`));

    for (const [channelID, channel] of guild.channels.cache) {
      if (channel.type === 'GUILD_VOICE') {
        for (const [memberID, member] of channel.members) {
          try {
            await member.voice.disconnect(); 
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(colorful(colors.green, `     [+] Membro ${member.user.tag} desconectado do canal ${channel.name}.`));
          } catch (error) {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(colorful(colors.red, `     [!] Falha ao desconectar ${member.user.tag} do canal ${channel.name}: ${error}`));
          }
        }
      }
    }

    console.log(colorful(colors.green, '\n     [=] Todos os membros foram desconectados de todos os canais de voz do servidor.'));
    setTimeout(() => utilInVoice(), 2000);
  });
};

const whitelist = async () => {
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, '     [=] Menu de WhiteList:'));
  console.log(colorful(colors.green, `     [1] Adicionar ID à WhiteList`));
  console.log(colorful(colors.green, `     [2] Remover ID da WhiteList`));
  console.log(colorful(colors.green, `     [3] Mostrar quantidade de IDs na WhiteList`));
  console.log(colorful(colors.green, `     [0] Voltar ao menu`));

  rl.question('     [-] Escolha uma opção: ', (choice) => {
    switch (choice) {
      case '1': addIdToWhitelist(); break;
      case '2': removeIdFromWhitelist(); break;
      case '3': showWhitelistCount(); break;
      case '0': showMenu(); break;
      default:
        console.log('Escolha uma opção válida.');
        whitelist();
    }
  });
};

const addIdToWhitelist = () => {
  rl.question('     [-] Insira o ID do usuário para adicionar à white list: ', (id) => {
    if (settings.whitelist.includes(id)) {
      console.log('     [x] ID já está na white list.');
      setTimeout(
        () => whitelist(),
        2000
      )
    } else {
      client.users.fetch(id)
      .then(user => {
        settings.whitelist.push(id);
        saveSettings();
        console.log('     [=] ID adicionado à white list.');
        setTimeout(
          () => whitelist(),
          2000
        )
        })
        .catch(error => {
          console.log('     Erro ao adicionar ID à white list.');
          setTimeout(
            () => whitelist(),
            2000
          )
        })
    }
  });
};

const removeIdFromWhitelist = () => {
  rl.question('     [-] Insira o ID do usuário para remover da white list: ', (id) => {
    const index = settings.whitelist.indexOf(id);
    if (index === -1) {
      console.log('     [x] ID não encontrado na white list.');
    } else {
      settings.whitelist.splice(index, 1);
      saveSettings();
      console.log(`     [✓] ID ${id} removido da white list.`);
    }
    whitelist();
  });
};

const showWhitelistCount = () => {
  console.log(`     [=] Total de IDs na white list: ${settings.whitelist.length}`);
  whitelist();
};

const whitelistServers = async () => {
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, '     [=] Menu de WhiteList de Servidores:'));
  console.log(colorful(colors.green, `     [1] Adicionar ID à WhiteList`));
  console.log(colorful(colors.green, `     [2] Remover ID da WhiteList`));
  console.log(colorful(colors.green, `     [3] Mostrar quantidade de IDs na WhiteList`));
  console.log(colorful(colors.green, `     [0] Voltar ao menu`));

  rl.question('     [-] Escolha uma opção: ', (choice) => {
    switch (choice) {
      case '1': addIdToWhitelistServers(); break;
      case '2': removeIdFromWhitelistServers(); break;
      case '3': showWhitelistCountServers(); break;
      case '0': showMenu(); break;
      default:
        console.log('Escolha uma opção válida.');
        whitelistServers();
    }
  });
};

const addIdToWhitelistServers = async () => {
  rl.question('     [-] Insira o ID do servidor para adicionar à white list: ', (id) => {
    if (settings.whiteListServers.includes(id)) {
      console.log('     [x] ID já está na white list.');
      setTimeout(() => {
        whitelistServers();
      }, 3000);
    } else {
      const server = client.guilds.fetch(id)
      .then((guild) => {
        if (guild) {
          settings.whiteListServers.push(id);
          saveSettings();
          console.log(`     [✓] ID ${id} adicionado à white list.`)
          setTimeout(() => {
            whitelistServers();
          }, 3000);
          }
     }).catch((error) => {
        console.log('     [x] ID não encontrado.');
        setTimeout(() => {
          whitelistServers();
        }, 3000);
        }
     )
    }
  });
};

const removeIdFromWhitelistServers = () => {
  rl.question('     [-] Insira o ID do servidor para remover da white list: ', (id) => {
    const index = settings.whiteListServers.indexOf(id);
    if (index === -1) {
      console.log('     [x] ID não encontrado na white list.');
    } else {
      settings.whitelist.splice(index, 1);
      saveSettings();
      console.log(`     [✓] ID ${id} removido da white list.`);
    }
    whitelistServers();
  });
};

const showWhitelistCountServers = () => {
  console.log(`     [=] Total de IDs na white list: ${settings.whitelist.length}`);
  whitelistServers();
};

const questionConfig = async () => {
  setStatus(client, 'Painel de Config');
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, `     [=] Bem-vindo, ${loggedInUser}`));
  console.log(colorful(colors.purple, '     [=] Escolha uma função:'));
  console.log("");
  console.log(colorful(colors.purple, '     [=] Configuracoes do Painel'));
  console.log("");
  console.log(colorful(colors.green, '     [1] Utilizar Token.'));
  console.log(colorful(colors.green, '     [2] Ativar/Desativar RPC ( Status do Painel )'));
  console.log(colorful(colors.green, '     [0] Voltar ao Menu.'));
  console.log("");

  rl.question(colorful(colors.purple, '     [=] Escolha uma opção: '), (answer) => {
    switch (answer) {
      case '1': updateToken(); break;
      case '2': toggleRPC(); break;
      case '0': showMenu(); break;
      default: showMenu();
    }
  });
};

const toggleRPC = async () => {
  let stateRPC = settings.stateRPC || "";

  if (stateRPC) {
    settings.stateRPC = false;
    await clearStatus(client);
    console.log(colorful(colors.purple, '     [=] RPC desativado e status limpo.'));
  } else {
    settings.stateRPC = true;
    await setStatus(client, 'Painel de Config');
    console.log(colorful(colors.purple, '     [=] RPC ativado e status configurado.'));
  }

  saveSettings();

  startCountdown(3);
};

const utilInChannel = async () => {
  setStatus(client, 'Utilidades em Chat');
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, `     [=] Bem-vindo, ${loggedInUser}!`));
  console.log(colorful(colors.purple, '     [=] Escolha uma função:'));
  console.log("");
  console.log(colorful(colors.green, '     [1] Flodar mensagem em 1 Canal.'));
  console.log(colorful(colors.green, '     [0] Voltar ao menu'));

  rl.question('     [-] Escolha de acordo:  ', (choice) => {
    switch (choice) {
      case '1': flodmsg(); break;
      case '0': showMenu(); break;
      default: showMenu();
    }           
  });
};

const flodmsg = async () => {
  rl.question('     [-] Digite a mensagem para flodar: ', (message) => {
    rl.question('     [-] Digite o ID do canal: ', async (channelId) => {
      const channel = client.channels.cache.get(channelId);

      if (!channel) {
        console.log('     Canal não encontrado.');
        return flodmsg();
      }

      if (!(channel instanceof TextChannel)) {
        console.log('     O canal especificado não é um canal de texto.');
        return flodmsg();
      }

      console.log('     Iniciando o flood. Digite "0" para parar.');

      let flod = true;

      const floodInterval = setInterval(async () => {
        if (!flod) {
          clearInterval(floodInterval);
          return;
        }

        try {
          await channel.send(message);
        } catch (error) {
          console.error('Erro ao enviar a mensagem:', error);
        }
      }, 100); 

      const stopFlood = () => {
        rl.question('     [-] Digite "0" para parar o flood: ', (input) => {
          if (input === '0') {
            flod = false;
            clearInterval(floodInterval);
            console.log('Flood interrompido.');
            showMenu();
          } else {
            stopFlood(); 
          }
        });
      };

      stopFlood();
    });
  });
};

function startCountdown(seconds: number): void {
  let counter = seconds;

  const interval = setInterval(() => {
      if (counter > 0) {
          console.log(`     Ação terminada. Voltando ao menu em ${counter} segundos...`);
          
          counter--;
      } else {
          clearInterval(interval);
          console.log("     Voltando ao menu agora...");
          showMenu();
      }
  }, 1000);
}

const setStatus = async (client: any, state: string) => {
  const stateRPC = settings.stateRPC;
  if(!stateRPC === true){
    return;
  }

  try {
    clearStatus(client);

    const getExtendURL = await RichPresence.getExternal(
      client,
      '1271469271574118441',
      'https://avatars.githubusercontent.com/u/175876903?v=4',
      client.user.avatarURL({ size: 4096 })
    );

    const status = new RichPresence(client)
      .setApplicationId('1271469271574118441')
      .setType('PLAYING')
      .setURL('https:/discord.gg/erro')
      .setState(state)
      .setDetails(`Version ${version}`)
      .setName('Victims Multi-tools')
      .setStartTimestamp(Date.now())
      .setAssetsLargeImage(getExtendURL[0].external_asset_path)
      .setAssetsSmallText('Running')
      .addButton('Victims', 'https://discord.gg/erro');

    client.user.setActivity(status);

    process.on('exit', () => {
      clearStatus(client);
    });

    process.on('SIGINT', () => {
      clearStatus(client);
      process.exit();
    });

    process.on('SIGTERM', () => {
      clearStatus(client);
      process.exit();
    });

  } catch (error) {
    console.error('Failed to set status:', error);
  }
};

const clearStatus = async (client: any) => {
  try {
    if (client.user) {
      await client.user.setActivity(null);
    }
  } catch (error) {
    console.error('Failed to clear status:', error);
  }
};

const loginClient = () => {
  loadSettings();
  if (!settings.token) {
    console.clear();
    console.log(colorful(colors.purple, banner));
    console.log(colorful(colors.purple, '     [x] Nenhum token encontrado. Por favor, forneça o token.'));
    updateToken();
  } else {
    client.login(settings.token).then(() => {
      showMenu();
    }).catch(() => {
      console.log('     Token inválido, por favor forneça um novo token.');
      updateToken();
    });
  }
};

loginClient();
