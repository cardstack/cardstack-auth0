const { isEqual } = require('lodash');
const { apply_patch } = require('jsonpatch');
const log = require('@cardstack/logger')('cardstack/auth0-auth/indexer');

module.exports = class Indexer {

  static create(...args) {
    return new this(...args);
  }

  constructor({ dataSource, provideUserSchema, patch }) {
    this.patch = patch || Object.create(null);
    if (provideUserSchema === false) {
      this.disabled = true;
    } else {
      if (dataSource.userTemplate){
        log.warn("If you use a custom user-template on the auth0-auth data source, you should probably also set params.provideUserSchema=false and provide your own user model");
      }
    }
  }

  async branches() {
    return ['master'];
  }

  async beginUpdate() {
    return new Updater(this.disabled, this.patch);
  }
};

class Updater {

  constructor(disabled, patch) {
    this.disabled = disabled;
    this.patch = patch;
  }

  async schema() {
    if (this.disabled) {
      return [];
    }

    let schema = [
      {
        type: 'content-types',
        id: 'auth0-users',
        attributes: {
        },
        relationships: {
          'fields': { data: [
            { type: 'fields', id: 'email' },
            { type: 'fields', id: 'avatar-url' },
            { type: 'fields', id: 'auth0-name' },
            { type: 'fields', id: 'auth0-id' },
          ] }
        }
      },
      {
        type: 'fields',
        id: 'auth0-id',
        attributes: {
          'field-type': '@cardstack/core-types::string'
        }
      },
      {
        type: 'fields',
        id: 'auth0-name',
        attributes: {
          'field-type': '@cardstack/core-types::string'
        }
      },
      {
        type: 'fields',
        id: 'email',
        attributes: {
          'field-type': '@cardstack/core-types::string'
        }
      },
      {
        type: 'fields',
        id: 'avatar-url',
        attributes: {
          'field-type': '@cardstack/core-types::string'
        }
      },
    ];
    return schema.map(doc => this._maybePatch(doc));
  }

  async updateContent(meta, hints, ops) {
    log.info("meta:", meta)
    let schema = await this.schema();
    if (meta) {
      let { lastSchema } = meta;
      if (isEqual(lastSchema, schema)) {
        return;
      }
    }
    await ops.beginReplaceAll();
    for (let model of schema) {
      await ops.save(model.type, model.id, { data: model });
    }
    await ops.finishReplaceAll();
    return {
      lastSchema: schema
    };
  }


  _maybePatch(doc) {
    let typePatches = this.patch[doc.type];
    if (typePatches) {
      let modelPatches = typePatches[doc.id];
      if (modelPatches) {
        doc = apply_patch(doc, modelPatches);
      }
    }
    return doc;
  }
}
