import {
  ColorResolvable,
  EmbedAuthorData,
  EmbedBuilder,
  EmbedFooterData,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  UserSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  MentionableSelectMenuBuilder,
  ButtonStyle,
  TextInputStyle,
  MessageActionRowComponentBuilder,
  ModalActionRowComponentBuilder,
} from "discord.js";

export interface EmbedOptions {
  title?: string;
  description?: string;
  color?: ColorResolvable;
  author?: EmbedAuthorData;
  footer?: EmbedFooterData;
  thumbnail?: string;
  image?: string;
  url?: string;
  timestamp?: boolean | number | Date;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  components?: ActionRowBuilder<MessageActionRowComponentBuilder>[];
}

export interface EmbedWithComponents {
  embeds: Embed[];
  components?: ActionRowBuilder<MessageActionRowComponentBuilder>[];
}

export interface ButtonOptions {
  customId?: string;
  label?: string;
  emoji?: string;
  style?: ButtonStyle;
  url?: string;
  disabled?: boolean;
}

export interface SelectMenuOptions {
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
  options?: Array<{
    label: string;
    value: string;
    description?: string;
    emoji?: string;
    default?: boolean;
  }>;
}

export interface TextInputOptions {
  customId: string;
  label: string;
  style?: TextInputStyle;
  placeholder?: string;
  value?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

export class ComponentContainer {
  private components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  addButton(options: ButtonOptions): this {
    const button = new ButtonBuilder();
    
    if (options.customId) button.setCustomId(options.customId);
    if (options.label) button.setLabel(options.label);
    if (options.emoji) button.setEmoji(options.emoji);
    if (options.style !== undefined) button.setStyle(options.style);
    if (options.url) button.setURL(options.url);
    if (options.disabled !== undefined) button.setDisabled(options.disabled);

    this.addComponent(button);
    return this;
  }

  addStringSelectMenu(options: SelectMenuOptions): this {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(options.customId);
    
    if (options.placeholder) selectMenu.setPlaceholder(options.placeholder);
    if (options.minValues !== undefined) selectMenu.setMinValues(options.minValues);
    if (options.maxValues !== undefined) selectMenu.setMaxValues(options.maxValues);
    if (options.disabled !== undefined) selectMenu.setDisabled(options.disabled);
    if (options.options) selectMenu.addOptions(options.options);

    this.addComponent(selectMenu);
    return this;
  }

  addUserSelectMenu(customId: string, options?: Omit<SelectMenuOptions, "customId">): this {
    const selectMenu = new UserSelectMenuBuilder()
      .setCustomId(customId);
    
    if (options?.placeholder) selectMenu.setPlaceholder(options.placeholder);
    if (options?.minValues !== undefined) selectMenu.setMinValues(options.minValues);
    if (options?.maxValues !== undefined) selectMenu.setMaxValues(options.maxValues);
    if (options?.disabled !== undefined) selectMenu.setDisabled(options.disabled);

    this.addComponent(selectMenu);
    return this;
  }

  addRoleSelectMenu(customId: string, options?: Omit<SelectMenuOptions, "customId">): this {
    const selectMenu = new RoleSelectMenuBuilder()
      .setCustomId(customId);
    
    if (options?.placeholder) selectMenu.setPlaceholder(options.placeholder);
    if (options?.minValues !== undefined) selectMenu.setMinValues(options.minValues);
    if (options?.maxValues !== undefined) selectMenu.setMaxValues(options.maxValues);
    if (options?.disabled !== undefined) selectMenu.setDisabled(options.disabled);

    this.addComponent(selectMenu);
    return this;
  }

  addChannelSelectMenu(customId: string, options?: Omit<SelectMenuOptions, "customId">): this {
    const selectMenu = new ChannelSelectMenuBuilder()
      .setCustomId(customId);
    
    if (options?.placeholder) selectMenu.setPlaceholder(options.placeholder);
    if (options?.minValues !== undefined) selectMenu.setMinValues(options.minValues);
    if (options?.maxValues !== undefined) selectMenu.setMaxValues(options.maxValues);
    if (options?.disabled !== undefined) selectMenu.setDisabled(options.disabled);

    this.addComponent(selectMenu);
    return this;
  }

  addMentionableSelectMenu(customId: string, options?: Omit<SelectMenuOptions, "customId">): this {
    const selectMenu = new MentionableSelectMenuBuilder()
      .setCustomId(customId);
    
    if (options?.placeholder) selectMenu.setPlaceholder(options.placeholder);
    if (options?.minValues !== undefined) selectMenu.setMinValues(options.minValues);
    if (options?.maxValues !== undefined) selectMenu.setMaxValues(options.maxValues);
    if (options?.disabled !== undefined) selectMenu.setDisabled(options.disabled);

    this.addComponent(selectMenu);
    return this;
  }

  addTextInput(options: TextInputOptions): this {
    const textInput = new TextInputBuilder()
      .setCustomId(options.customId)
      .setLabel(options.label);
    
    if (options.style !== undefined) textInput.setStyle(options.style);
    if (options.placeholder) textInput.setPlaceholder(options.placeholder);
    if (options.value) textInput.setValue(options.value);
    if (options.required !== undefined) textInput.setRequired(options.required);
    if (options.minLength !== undefined) textInput.setMinLength(options.minLength);
    if (options.maxLength !== undefined) textInput.setMaxLength(options.maxLength);

    this.addComponent(textInput as unknown as MessageActionRowComponentBuilder);
    return this;
  }

  private addComponent(component: MessageActionRowComponentBuilder): void {
    // Find the last action row or create a new one
    let lastRow = this.components[this.components.length - 1];
    
    // Check if we need a new row (max 5 buttons per row, 1 select menu per row)
    const needsNewRow = !lastRow || 
      (component instanceof ButtonBuilder && lastRow.components.length >= 5) ||
      (!(component instanceof ButtonBuilder) && lastRow.components.length > 0);

    if (needsNewRow) {
      lastRow = new ActionRowBuilder<MessageActionRowComponentBuilder>();
      this.components.push(lastRow);
    }

    lastRow.addComponents(component);
  }

  addActionRow(actionRow: ActionRowBuilder<MessageActionRowComponentBuilder>): this {
    this.components.push(actionRow);
    return this;
  }

  getComponents(): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
    return this.components;
  }

  clear(): this {
    this.components = [];
    return this;
  }
}

export class ModalContainer {
  private components: ActionRowBuilder<ModalActionRowComponentBuilder>[] = [];

  addTextInput(options: TextInputOptions): this {
    const textInput = new TextInputBuilder()
      .setCustomId(options.customId)
      .setLabel(options.label);
    
    if (options.style !== undefined) textInput.setStyle(options.style);
    if (options.placeholder) textInput.setPlaceholder(options.placeholder);
    if (options.value) textInput.setValue(options.value);
    if (options.required !== undefined) textInput.setRequired(options.required);
    if (options.minLength !== undefined) textInput.setMinLength(options.minLength);
    if (options.maxLength !== undefined) textInput.setMaxLength(options.maxLength);

    this.addComponent(textInput);
    return this;
  }

  private addComponent(component: ModalActionRowComponentBuilder): void {
    const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>()
      .addComponents(component);
    this.components.push(actionRow);
  }

  addActionRow(actionRow: ActionRowBuilder<ModalActionRowComponentBuilder>): this {
    this.components.push(actionRow);
    return this;
  }

  getComponents(): ActionRowBuilder<ModalActionRowComponentBuilder>[] {
    return this.components;
  }

  clear(): this {
    this.components = [];
    return this;
  }
}

export class Embed extends EmbedBuilder {
  public components?: ActionRowBuilder<MessageActionRowComponentBuilder>[];
  public container: ComponentContainer;
  public modalContainer: ModalContainer;

  constructor(options: EmbedOptions = {}) {
    super();

    this.container = new ComponentContainer();
    this.modalContainer = new ModalContainer();

    if (options.title) this.setTitle(options.title);
    if (options.description) this.setDescription(options.description);
    if (options.color) this.setColor(options.color);
    if (options.author) this.setAuthor(options.author);
    if (options.footer) this.setFooter(options.footer);
    if (options.thumbnail) this.setThumbnail(options.thumbnail);
    if (options.image) this.setImage(options.image);
    if (options.url) this.setURL(options.url);

    if (options.timestamp) {
      if (typeof options.timestamp === "boolean") {
        this.setTimestamp();
      } else {
        this.setTimestamp(options.timestamp);
      }
    }

    if (options.fields) {
      options.fields.forEach(field => {
        this.addFields(field);
      });
    }

    if (options.components) {
      this.components = options.components;
    }
  }

  setComponents(components: ActionRowBuilder<MessageActionRowComponentBuilder>[]): this {
    this.components = components;
    return this;
  }

  addActionRow(actionRow: ActionRowBuilder<MessageActionRowComponentBuilder>): this {
    if (!this.components) {
      this.components = [];
    }
    this.components.push(actionRow);
    return this;
  }

  // Convenience methods for adding components via container
  addButton(options: ButtonOptions): this {
    this.container.addButton(options);
    this.components = this.container.getComponents();
    return this;
  }

  addStringSelectMenu(options: SelectMenuOptions): this {
    this.container.addStringSelectMenu(options);
    this.components = this.container.getComponents();
    return this;
  }

  addUserSelectMenu(customId: string, options?: Omit<SelectMenuOptions, "customId">): this {
    this.container.addUserSelectMenu(customId, options);
    this.components = this.container.getComponents();
    return this;
  }

  addRoleSelectMenu(customId: string, options?: Omit<SelectMenuOptions, "customId">): this {
    this.container.addRoleSelectMenu(customId, options);
    this.components = this.container.getComponents();
    return this;
  }

  addChannelSelectMenu(customId: string, options?: Omit<SelectMenuOptions, "customId">): this {
    this.container.addChannelSelectMenu(customId, options);
    this.components = this.container.getComponents();
    return this;
  }

  addMentionableSelectMenu(customId: string, options?: Omit<SelectMenuOptions, "customId">): this {
    this.container.addMentionableSelectMenu(customId, options);
    this.components = this.container.getComponents();
    return this;
  }

  addTextInputToModal(options: TextInputOptions): this {
    this.modalContainer.addTextInput(options);
    return this;
  }

  toMessagePayload(): EmbedWithComponents {
    return {
      embeds: [this],
      components: this.components,
    };
  }

  createModal(customId: string, title: string): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(customId)
      .setTitle(title);

    // Add text inputs from modal container if any
    const components = this.modalContainer.getComponents();
    components.forEach(row => {
      modal.addComponents(row);
    });

    return modal;
  }

  static success(description: string, title = "Success"): Embed {
    return new Embed({
      title,
      description,
      color: "#43B581",
      timestamp: true,
    });
  }

  static error(description: string, title = "Error"): Embed {
    return new Embed({
      title,
      description,
      color: "#F04747",
      timestamp: true,
    });
  }

  static info(description: string, title = "Information"): Embed {
    return new Embed({
      title,
      description,
      color: "#0099FF",
      timestamp: true,
    });
  }

  static warning(description: string, title = "Warning"): Embed {
    return new Embed({
      title,
      description,
      color: "#FFA500",
      timestamp: true,
    });
  }
}

export default Embed;