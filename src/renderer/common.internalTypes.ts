import { flow } from 'fp-ts/lib/function';
import * as t from 'io-ts';
import * as E from 'fp-ts/Either';
import { failure } from 'io-ts/lib/PathReporter';

const Model = t.type({
  number: t.string,
  cardboardBox: t.string,
  count: t.string,
  image: t.string,
  gender: t.string,
  clothe: t.string,
  titleEtsy: t.string,
  desc: t.string,
  brand: t.string,
  flaws: t.string,
  color: t.string,
  size: t.string,
  tags: t.string,
  material: t.string,
  price: t.string,
  style: t.string,
});

const Collection = t.array(Model);

export type Model = t.TypeOf<typeof Model>;

export const decoder = flow(
  Collection.decode,
  E.mapLeft((errors) => failure(errors).join('\n'))
);
