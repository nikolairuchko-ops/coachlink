# COACH LINK

Простое статическое HTML-приложение для тренера и спортсмена на Supabase.

## Запуск
Откройте `index.html` в браузере или включите GitHub Pages для ветки `main` и корня репозитория.

## Supabase
- Project URL: `https://gozakkwuwkylvcugtmps.supabase.co`
- В браузере используется только публичный publishable key; `service_role` / secret key не используется.
- Регистрация всегда создаёт роль `athlete` через существующий trigger `handle_new_user`.
- Роль `coach` и `invite_code` назначаются администратором.
- Панель выбирается по `profiles.role`; данные дополнительно ограничиваются RLS.
- Спортсмен подключается к тренеру через RPC `join_coach_by_code`.

## Перед тестированием
1. В Supabase Authentication включите Email provider.
2. В Authentication → URL Configuration добавьте адрес сайта в разрешённые Redirect URLs.
3. Создайте тестовый аккаунт — регистрация создаёт спортсмена.
4. Для теста тренера администратор должен назначить профилю `role='coach'` и уникальный `invite_code`.
5. Войдите спортсменом и подключитесь по коду тренера.

## Защита
Это статическое HTML-приложение с hash-маршрутами `#/coach` и `#/athlete`. Сессия и роль проверяются перед показом кабинета. Скрытие блоков интерфейса не является границей безопасности: реальные ограничения строк выполняются политиками RLS Supabase.

Таблицы: `profiles`, `coach_athletes`, `training_tasks`, `coach_news`, `news_subscriptions`, `skill_records`.
