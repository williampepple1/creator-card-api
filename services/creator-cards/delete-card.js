const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const createRepositoryFactory = require('@app-core/repository-factory');
const CreatorCardMessages = require('@app/messages/creator-card');

const repo = createRepositoryFactory('CreatorCard');

const deleteCardSpec = `root {
  creator_reference string<length:20>
}`;

const parsedDeleteCardSpec = validator.parse(deleteCardSpec);

async function deleteCreatorCard(slug, serviceData) {
  const data = validator.validate(serviceData, parsedDeleteCardSpec);

  // Find the card
  const card = await repo.findOne({ query: { slug, deleted: null } });

  if (!card) {
    throwAppError(CreatorCardMessages.CARD_NOT_FOUND, ERROR_CODE.NOTFOUND, {
      context: { code: 'NF01' },
    });
  }

  // Soft delete: set deleted timestamp
  const now = Date.now();
  await repo.updateOne({
    query: { slug },
    updateValues: { deleted: now, updated: now },
  });

  // Return the deleted card
  const response = { ...card };
  response.id = response._id;
  response.deleted = now;
  response.updated = now;
  delete response._id;
  delete response.__v;

  return response;
}

module.exports = deleteCreatorCard;
