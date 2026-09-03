CREATE OR REPLACE VIEW public.posts_public AS
SELECT id,
    tipo,
    titulo,
    corpo,
    cidade,
    uf,
    prefeitura_id,
        CASE
            WHEN is_anonimo THEN NULL::uuid
            ELSE autor_id
        END AS autor_id,
        CASE
            WHEN is_anonimo THEN 'Anônimo'::text
            ELSE autor_display_name
        END AS autor_display_name,
    is_anonimo,
    is_official,
    status,
    cover_url,
    media_urls,
    like_count,
    dislike_count,
    comment_count,
    published_at,
    moderation_note,
    enquete_opcoes,
    created_at,
    updated_at,
    categoria,
    bairro,
    audio_url,
    after_photo_url,
    official_response,
    official_response_date,
    promise_text,
    promise_deadline,
    support_count,
    weekly_support_count,
    status_denuncia,
    selo,
    selo_em,
    video_url
   FROM posts;