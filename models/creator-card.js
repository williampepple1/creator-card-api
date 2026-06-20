const { ModelSchema, DatabaseModel, SchemaTypes } = require('@app-core/mongoose');

const creatorCardSchema = new ModelSchema(
  {
    _id: SchemaTypes.ULID,
    title: { type: String, required: true },
    description: { type: String, default: '' },
    slug: { type: String, required: true, unique: true },
    creator_reference: { type: String, required: true },
    links: { type: Array, default: [] },
    service_rates: { type: SchemaTypes.Mixed, default: null },
    status: { type: String, required: true },
    access_type: { type: String, default: 'public' },
    access_code: { type: String, default: null },
    created: { type: Number, default: Date.now },
    updated: { type: Number, default: Date.now },
    deleted: { type: Number, default: null },
  },
  { _id: false, timestamps: false }
);

const CreatorCard = DatabaseModel.model('CreatorCard', creatorCardSchema);

module.exports = CreatorCard;
