import {
  ColorResolvable,
  EmbedAuthorData,
  EmbedBuilder,
  EmbedFooterData,
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
}

export class Embed extends EmbedBuilder {
  constructor(options: EmbedOptions = {}) {
    super();

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
