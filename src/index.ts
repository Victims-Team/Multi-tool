import readline from 'readline';
import { Client, Collection, RichPresence, TextChannel, DMChannel, VoiceChannel, Permissions, Role, CategoryChannel, Guild, Message, User } from 'discord.js-selfbot-v13';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const client = new Client({});

process.title = 'Multi-tool';

interface Settings {
  token: string;
  trigger: string;
}

let settings: Settings = {
  token: '',
  trigger: '',
};

const settingsFilePath = path.resolve(__dirname, 'settings.json');

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

const loadSettings = () => {
  if (fs.existsSync(settingsFilePath)) {
    const fileData = fs.readFileSync(settingsFilePath, 'utf8');
    settings = JSON.parse(fileData);
  }
};

const saveSettings = () => {
  fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
};

client.once('ready', () => {
  console.clear();
  loggedInUser = client.user?.username || '';
  if (!loggedInUser) {
    console.log(colorful(colors.purple, banner));
    console.log(colorful(colors.purple, '     [x] Você está deslogado. Por favor, faça login.'));
    updateToken();
  } else {
    showMenu();
  }
});

const showMenu = () => {
  setStatus(client, 'Standing on the dashboard')
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, `     [=] Bem-vindo, ${loggedInUser}!`));
  console.log(colorful(colors.purple, '     [=] Escolha uma função:'));
  console.log("");
  console.log(colorful(colors.green, '     [1] Limpar DM ou Canal.'));
  console.log(colorful(colors.green, '     [2] Limpar todas as DMs abertas.'));
  console.log(colorful(colors.green, '     [3] Limpar DM de Amigos.'));
  console.log(colorful(colors.green, '     [4] Definir Palavra-chave do Trigger.'));
  console.log(colorful(colors.green, '     [5] Clonar servidor.'));
  console.log(colorful(colors.green, '     [9] Atualizar Token.'));
  console.log(colorful(colors.green, '     [0] Fechar.'));
  console.log("");

  rl.question('     [-] Escolha de acordo com o número:  ', (choice) => {
    switch (choice) {
      case '1': clearDm(); break;
      case '2': clearOpenDMs(); break;
      case '3': clearDmFriends(); break;
      case '4': setTrigger(); break;
      case '5': cloneServer(); break;
      case '9': updateToken(); break;
      case '0': process.exit(); break;
      default: 
        console.log('Escolha apenas as funções acima.');
        showMenu();
    }
  });
};

client.on('messageCreate', async (message: Message) => {
  if (message.author.id === client.user?.id && message.content === settings.trigger && !message.system) {
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
            count++;
            console.log(`     [+] Deletando mensagem do usuário em: ${channel instanceof DMChannel ? 'DM' : (channel as TextChannel).name}`);
          }
          lastId = msg.id;
        }
      } while (messages.size > 0);

      console.log(`     [✓] Limpeza concluída. Total de mensagens deletadas: ${count}`);
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
  setStatus(client, "Utilizando Clear DM's")
  try {
    const dms = client.channels.cache.filter(channel => channel.type === 'DM') as Collection<string, DMChannel>;
    if (dms.size === 0) {
      console.log('     [=] Não há DMs abertas.');
      showMenu();
      return;
    }

    for (const dm of dms.values()) {
      let count = 0;
      let totalUserMessages = 0;
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
            totalUserMessages++;
            if (!message.system) {
              await message.delete();
              count++;
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
  } catch (error) {
    console.log('     [x] Ocorreu um erro:', error);
    startCountdown(5);
  }
};

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

const clearDmFriends = async () => {
  console.clear();
  console.log(colorful(colors.purple, banner));
  console.log(colorful(colors.purple, '     [x] Limpando DM de Amigos...'));
  setStatus(client, "Limpando DM de Amigos")
  const friends = await requestFriends(client);

  let count = 0;
  for (const friend of friends) {
    const dm = await client.channels.cache.find(ch => ch instanceof DMChannel && (ch as DMChannel).recipient?.id === friend.id);
    if (!dm || !(dm instanceof DMChannel)) continue;

    let lastId: string | undefined;
    let messages: Collection<string, Message>;

    do {
      messages = await dm.messages.fetch({ limit: 100, ...(lastId && { before: lastId }) });
      if (messages.size === 0) break;

      const sortedMessages = Array.from(messages.values()).sort((a, b) => (b as Message).createdTimestamp - (a as Message).createdTimestamp);

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

            const permissions = channel.permissionOverwrites.cache.map(overwrite => ({
              id: overwrite.id === originalGuild.roles.everyone.id ? newGuild.roles.everyone.id : roleMap.get(overwrite.id)?.id || overwrite.id,
              allow: overwrite.allow.bitfield,
              deny: overwrite.deny.bitfield
            }));

            await newChannel.permissionOverwrites.set(permissions);
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
  try {
    clearStatus(client);

    const getExtendURL = await RichPresence.getExternal(
      client,
      '367827983903490050',
      'https://cdn.victims.lol/uploads/a_5e351aea728e10c7c39f94e55f1ed7ac-1722902571447.gif',
      client.user.avatarURL({ size: 4096 })
    );

    const status = new RichPresence(client)
      .setApplicationId('367827983903490050')
      .setType('PLAYING')
      .setURL('https:/discord.gg/erro')
      .setState(state)
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
