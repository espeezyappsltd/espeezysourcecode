/** Article reactions are not migrated yet — keep UI working without throwing. */

export type ArticleReaction = { type: string; userId: string }

export async function getArticleReactions(_articleId: string): Promise<ArticleReaction[]> {
  return []
}

export async function addReaction(
  _articleId: string,
  _userId: string,
  _type: string,
): Promise<null> {
  return null
}
