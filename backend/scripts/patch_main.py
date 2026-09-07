import logging

def patch_main():
    with open('backend/main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Patch start_session
    old_start = '''        cursor = {"hobby_idx": 0, "place_idx": 0}

        query = build_query_for_category(profile, category, cursor)
        photo = await fetch_unsplash_photo(query)'''
        
    new_start = '''        cursor = {"hobby_idx": 0, "place_idx": 0}

        try:
            from langchain_embed import generate_query_chain
            profile_str = f"Hobbies: {profile.hobbies}\\nPast activities: {profile.past_activities}\\nFavorite places: {profile.favorite_places}\\nLife milestones: {profile.life_milestones}"
            query = await generate_query_chain.ainvoke({"profile": profile_str})
            query = query.strip()
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"LangChain LLM failed, falling back to heuristic: {e}")
            query = build_query_for_category(profile, category, cursor)

        photo = await fetch_unsplash_photo(query)'''
        
    # Patch next_image
    old_next = '''        session["category_index"] = (session["category_index"] + 1) % len(CATEGORY_ORDER)
        category = CATEGORY_ORDER[session["category_index"]]
        session["step"] += 1

        query = build_query_for_category(session["profile"], category, session["cursor"])
        session["current_query"] = query
        
        photo = await fetch_unsplash_photo(query)'''
        
    new_next = '''        session["category_index"] = (session["category_index"] + 1) % len(CATEGORY_ORDER)
        category = CATEGORY_ORDER[session["category_index"]]
        session["step"] += 1

        try:
            from langchain_embed import generate_query_chain
            profile = session["profile"]
            profile_str = f"Hobbies: {profile.hobbies}\\nPast activities: {profile.past_activities}\\nFavorite places: {profile.favorite_places}\\nLife milestones: {profile.life_milestones}"
            query = await generate_query_chain.ainvoke({"profile": profile_str})
            query = query.strip()
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"LangChain LLM failed, falling back to heuristic: {e}")
            query = build_query_for_category(session["profile"], category, session["cursor"])
            
        session["current_query"] = query
        
        photo = await fetch_unsplash_photo(query)'''
        
    content = content.replace(old_start, new_start)
    content = content.replace(old_next, new_next)
    
    with open('backend/main.py', 'w', encoding='utf-8') as f:
        f.write(content)

patch_main()
